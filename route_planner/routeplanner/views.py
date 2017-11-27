# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render
from django.views.decorators.csrf import csrf_protect
from django.http import HttpResponse

from models import get_route, get_tourism_routes

import json

# Create your views here.


def index(request):
    #s = db_connect()
    #test_select = s.execute("select * from ways limit 10;").fetchall()
    #s.close()
    options = {}
    options['amenity'] = ['bar','caffe','pub','restaurant','fuel']
    options['tourism'] = ['hotel','motel','information','viewpoint','camp_site']
    options['route'] = ['bicycle','foot','hiking']
    options['colors'] = {'bar':"#ff7800",'caffe':"#bf8040", 'pub':"#66ff33", 'restaurant':"#ffff80",'fuel':"#1a75ff",'hotel':"#df80ff",'motel':"#ff5050",'information':"#f2f2f2",'viewpoint':"#b3ffb3",'camp_site':"#2eb82e"};
    return render(request, 'routeplanner/index.html',{'options':options})

@csrf_protect
def find_route(request):
    if request.method == 'POST':
        body = json.loads(request.body)
        data = body['data']
        options = body['options']
        print body
        keys = ['amenity','tourism']
        coords = []
        geojson = {}
        message = "Less than two coordinates given! Need at least two coordinates."
        error = 0
        for i in range(len(data)):
            try:
                data[str(i)][u"lon"] = float(data[str(i)][u"lon"])
                data[str(i)][u"lat"] = float(data[str(i)][u"lat"])
                coords.append(data[str(i)])
            except ValueError as e:
                pass
        try:
            options['distance']  = float(options['distance']) * 1000
        except ValueError as e:
            val = None
            for k in keys:
                val = val or k in options
            if val:
                message = "Distance must be valid number."
                error = 1

        try:
            options['radius']  = float(options['radius']) * 1000
        except ValueError as e:
            if options['route'] != "":
                message = "Radius must be valid number."
                error = 1 
    
        if len(coords) > 1 and not error:
            geojson_data = get_route(coords, options, keys)
            if options['route'] != "":
                for coord in coords[1:]:
                    res = get_tourism_routes(coord, options['radius'], options['route'])
                    for g in res:
                        print g
                        print "\n"
                        geojson_data.append(g)
    
            geojson = {"success":{"geojson":geojson_data}}

        else:
            geojson = {"error":{"message":message}}
        return HttpResponse(json.dumps(geojson),content_type="application/json")

#def get_closest_node(lon,lat,session):
#    c_node = session.query(Ways).order_by(Ways.the_geom.ST_Distance(func.ST_SetSRID(func.ST_Point(lon, lat), 4326))).limit(1).all()
#    dist_source = session.query(func.ST_Distance(func.ST_SetSRID(func.ST_Point(c_node[0].x1, c_node[0].y1), 4326), func.ST_SetSRID(func.ST_Point(lon, lat), 4326))).all()
#    dist_target = session.query(func.ST_Distance(func.ST_SetSRID(func.ST_Point(c_node[0].x2, c_node[0].y2), 4326), func.ST_SetSRID(func.ST_Point(lon, lat), 4326))).all()
#    # distances return only one value
#    if dist_source[0][0] < dist_target[0][0]:
#        return c_node[0].source
#    else:
#        return c_node[0].target
#
#    return None

