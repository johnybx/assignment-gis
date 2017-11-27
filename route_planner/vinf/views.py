# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render
from elasticsearch import Elasticsearch
import json
from django.http import HttpResponse
# Create your views here.

def index(request):
    #s = db_connect()
    #test_select = s.execute("select * from ways limit 10;").fetchall()
    #s.close()
    es = Elasticsearch()
    x = {"query": {"bool":{"must":[{"match_all": {}}]}},'aggs': {'druh': {'terms': {'field': 'druh.untouched', 'order': {'_count': 'desc'}, 'size': 5}},
                                            'stav': {'terms': {'field': 'stav.untouched', 'order': {'_count': 'desc'}, 'size': 5}},
                                            'okres': {'terms': {'field': 'okres.untouched', 'order': {'_count': 'desc'}, 'size': 5}},
                                            'cena': {'range': {'field': 'cena', 'ranges' : [{ "from": 0, "to" : 25000 },
                                                                                            { "from" : 25000, "to" : 75000 },
                                                                                            { "from" : 75000, "to" : 125000},
                                                                                            { "from" : 125000, "to": 100000000}]}}}}
    if request.method == 'POST':
        x = json.loads(request.POST['query'])
        if request.POST['typ'] == "search_all":
            x['query'] = {"bool": {"must": [{"match": {"_all": request.POST['search_string']}}]}}
        elif request.POST['typ'] == "geo_search":
            x['query']['bool']['filter'] = {"geo_distance" : 
                     { "distance" : str(request.POST['vzdialenost'])+"km","poloha" : {
                        "lat" : float(request.POST['Latitude']),
                        "lon" : float(request.POST['Longtitude'])}}}
            dist = float(request.POST['vzdialenost'])/4
            x['aggs']['geodistance'] = {"geo_distance" : {"field" : "poloha",
                                                          "origin" : {"lat":float(request.POST['Latitude']),
                                                                      "lon":float(request.POST['Longtitude'])},
                                                          "unit" : "km",
                                                          "ranges" : [{"from":0,"to":dist},
                                                                      {"from":dist, "to":dist*2},
                                                                      {"from":dist*2,"to":dist*3},
                                                                      {"from":dist*3, "to":float(request.POST['vzdialenost'])}]}}
        elif request.POST['typ'] == "search_filter":
            field = request.POST['field']
            if field != '_all' and field != 'cena':
                field += '.untouched'
            field_value = request.POST['field_value']
            if field_value == "":
                field_value = 'Reset'

            elif field == 'cena':
                field_value = field_value.split(" ")[0]

            found = 0
            reset_indx = -1
            for i,val in enumerate(x['query']['bool']['must']):
                if  field_value != 'Reset' and field == 'cena' and 'range' in val:
                    val['range'][field]['gte'] = float(field_value.split('-')[0])
                    val['range'][field]['lt'] = float(field_value.split('-')[1])
                     
                elif field_value != 'Reset' and 'match' in val and field in val['match']:
                    val['match'][field] = field_value
                    found = 1

                elif field_value == 'Reset' and 'match' in val and field in val['match']:
                    reset_indx = i
                elif field == 'cena' and field_value == 'Reset' and 'range' in val:
                    reset_indx = i
                #if 'match_all' in val:
                #    match_all_indx = i
            if field == 'cena' and field_value != 'Reset' and not found:
                x['query']['bool']['must'].append({"range":{ field : {'gte':float(field_value.split('-')[0]),'lt':float(field_value.split('-')[1])}}})
            elif field_value != 'Reset' and not found:
                x['query']['bool']['must'].append({"match": {field: field_value}})

            if reset_indx != -1 and field_value == 'Reset':
                x['query']['bool']['must'].pop(reset_indx)
            #if match_all_indx != -1:
            #    x['query']['bool']['must'].pop(match_all_indx)
            print x


    res = es.search(index='realty',doc_type='test',body = x)
    aggs = res['aggregations']
    result = res['hits']['hits']
    geojson = []
    for point in result:
        j = { "type": "Feature",
             "properties": {
                "name": point['_source']['nazov'],
            },
            "geometry": {
                "type": "Point",
                "coordinates": [point['_source']['poloha']['lon'], point['_source']['poloha']['lat']]
            }}    
        geojson.append(j)
 
    return render(request, 'vinf/index.html', {'aggs':aggs,'result':result,'geojson':json.dumps(geojson),'query':json.dumps(x)})


def autocomplete(request):
    if request.method == 'POST':
        response = json.loads(request.body)
        x = json.loads(response['query'])
        val = response['field_value']
        x['query']['bool']['must'].append({"match": {'nazov': val}})
        es = Elasticsearch()
        res = es.search(index='realty',doc_type='test',body = x)
        
        return HttpResponse(json.dumps(res['hits']['hits']),content_type="application/json")
