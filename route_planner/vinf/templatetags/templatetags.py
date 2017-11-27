


from django import template
register = template.Library()

@register.filter(name='get')
def get(d, k):
    keys = k.split("|")
    if len(keys) == 2:
        x = d.get(keys[0], None)
        return x.get(keys[1], None)
    else:
        return d.get(keys[0], None)

@register.filter(name='kontakt')
def kontakt(d):
    string = ""
    if 'meno' in d['_source']['kontakt']:
        string += "<b>Meno:</b> %s <br>" % (d['_source']['kontakt']['meno'])
    if 'phone_num' in d['_source']['kontakt']:
        string += "<b>Kontaktne cislo:</b> %s <br>" % (d['_source']['kontakt']['phone_num']) 
    if 'info' in d['_source']['kontakt']:
        string += "<b>Informacie:</b> %s <br>" % (d['_source']['kontakt']['info'])

    return string 
