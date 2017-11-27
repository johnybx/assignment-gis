# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models
from django.conf import settings

import json

from sqlalchemy import create_engine, Text, Column
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine.url import URL
from sqlalchemy.dialects.postgresql import BIGINT as BigInteger, INTEGER as Integer, DOUBLE_PRECISION as Double_Precision
from sqlalchemy.ext.declarative import declarative_base
from geoalchemy2 import Geometry, func


# Create your models here.
Base = declarative_base()

def db_connect():
    conn = settings.DATABASES['postgres-geodata']
    engine = create_engine(URL(conn['drivername'], conn['username'], conn['password'], conn['host'], conn['port'], conn['database']))
    return sessionmaker(bind=engine)()

def get_closest_node(lon,lat,session):
    c_node = session.query(Ways).order_by(Ways.the_geom.ST_Distance(func.ST_SetSRID(func.ST_Point(lon, lat), 4326))).limit(1).all()
    dist_source = session.query(func.ST_Distance(func.ST_SetSRID(func.ST_Point(c_node[0].x1, c_node[0].y1), 4326), func.ST_SetSRID(func.ST_Point(lon, lat), 4326))).all()
    dist_target = session.query(func.ST_Distance(func.ST_SetSRID(func.ST_Point(c_node[0].x2, c_node[0].y2), 4326), func.ST_SetSRID(func.ST_Point(lon, lat), 4326))).all()
    # distances return only one value

    if dist_source[0][0] < dist_target[0][0]:
        return c_node[0].source
    else:
        return c_node[0].target

def get_route(coords, options, keys):
    session = db_connect()
    query = """ WITH route AS (SELECT route.seq, route.path_seq , ST_AsText(the_geom) AS coords, the_geom, ST_AsGeoJson(the_geom) as geojson1 FROM pgr_bddijkstra('SELECT gid AS id, source AS source,target AS target, cost_s AS cost,reverse_cost_s as reverse_cost,x1,x2,y1,y2 FROM ways',%d,%d,true) as route join ways on edge = gid order by route.path_seq) SELECT *,'' as name,'' as brand,'' as amenity,'' as tourism, st_point(0,0) as way, '' as geojson2 from route """ 

    opt_query = """UNION ALL SELECT seq,path_seq,coords,the_geom, geojson1, name, brand, amenity, tourism, way, ST_AsGeoJson(st_transform(way,4326)) as geojson2 from route as r join planet_osm_point as p on st_distance(ST_transform(r.the_geom,3857),ST_Transform(p.way,3857)) < %f where %s order by path_seq; """
    
    operator = ""
    condition = ""
    for k in keys:
        if k in options:
            for value in options[k]:
                condition += operator + " %s='%s' " % (k,value)
                operator = "OR"

    if operator != "":
        query += opt_query % (options['distance'], condition)
    coords_id = []
    for c in coords:
        coords_id.append(get_closest_node(c['lon'],c['lat'],session))

    geojson = []
    for i,c in enumerate(coords_id[:-1]):
        result = session.execute(query % (c,coords_id[i+1])).fetchall()
        for r in result:
            if r[7] == '' and r[8] == '':
                geojson.append({"type": "Feature", "properties": {"name": "route"}, "geometry": json.loads(r[4])})
            else:
                geojson.append({"type": "Feature", "properties": {"name": r[5], "brand": r[6], "amenity":r[7], "tourism":r[8]}, "geometry": json.loads(r[-1])})
                popup_text = ""
                if r[5] != None and r[5] != "":
                    popup_text += "Name: %s <br>" % r[5]
                if r[6] != None and r[6] != "":
                    popup_text += "Brand: %s <br>" % r[6] 
                geojson[-1]['properties']['popup_text'] = popup_text
    session.close()

    return geojson


def get_tourism_routes(coords, radius, route_type):
    session = db_connect()
    geojson = []
    node_id = get_closest_node(coords['lon'],coords['lat'],session)
    # % (lon,lat)
    query = """select name, operator, ref, ST_AsGeoJson(st_transform(way,4326)) from planet_osm_line where st_within(ST_TRANSFORM(way,3857) ,ST_Buffer(ST_Transform(ST_SetSRID(ST_Point(%f,%f), 4326),3857),%f))=true and route='%s'; """
    print query % (coords['lon'],coords['lat'], radius, route_type)
    result = session.execute(query % (coords['lon'],coords['lat'], radius, route_type)).fetchall()
    print result
    keys = ['name', 'operator', 'ref']
    for r in result:
        geojson_tmp = {"type": "Feature", "properties": {'popup_text':""},"geometry": ""}
        for i, col in enumerate(r[:-1]):
            geojson_tmp['properties'][keys[i]] = col
            if col != None and col != "":
                geojson_tmp['properties']['popup_text'] += keys[i][0].upper() + keys[i][1:] + ": " + col + "<br>"
        geojson_tmp['geometry'] = json.loads(r[-1])
        geojson.append(geojson_tmp)

    session.close()
    return geojson

class Ways(Base):
    __tablename__ = 'ways'
    gid =  Column(BigInteger, primary_key = True, nullable = False, autoincrement=False)
    class_id = Column(Integer)
    length = Column(Double_Precision)
    length_m = Column(Double_Precision)
    name = Column(Text)
    source = Column(BigInteger)
    target = Column(BigInteger)
    x1 = Column(Double_Precision)
    y1 = Column(Double_Precision)
    x2 = Column(Double_Precision)
    y2 = Column(Double_Precision)
    cost = Column(Double_Precision)
    reverse_cost = Column(Double_Precision)
    cost_s = Column(Double_Precision)
    reverse_cost_s = Column(Double_Precision)
    rule = Column(Text)
    one_way = Column(Integer)
    maxspeed_forward = Column(Integer)
    maxspeed_backward = Column(Integer)
    osm_id = Column(BigInteger)
    source_osm = Column(BigInteger)
    target_osm = Column(BigInteger)
    priority = Column(Double_Precision)
    the_geom = Column(Geometry('LINESTRING'))

