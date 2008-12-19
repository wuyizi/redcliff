# Please run this script under 'redcliff' or 'redcliff/dev'
# It will output the packed xml to mapplet/redcliff_packed.xml

# require file
XML_PATH = r'mapplet/redcliff.xml'
REDCLIFF_JS_PATH = r'javascript/redcliff.js'
S2_JS_PATH = r'javascript/s2.js'
CSS_PATH = r'media/redcliff.css'

# response file
PACKED_XML_PATH = r'mapplet/redcliff_packed.xml'

CSS_LINK = r'<link rel="stylesheet" type="text/css" href="http://redcliff.googlecode.com/svn/trunk/dev/media/redcliff.css?r=12"></link>'

REDCLIFF_JS_LINK = r'<script src="http://redcliff.googlecode.com/svn/trunk/dev/javascript/redcliff.js?bpc=1004" type="text/javascript"></script>'

S2_JS_LINK = r'<script src="http://redcliff.googlecode.com/svn/trunk/dev/javascript/s2.js" type="text/javascript"></script>'

xml = open(XML_PATH, 'r')
redcliff_js = open(REDCLIFF_JS_PATH, 'r')
s2_js =open(S2_JS_PATH, 'r')
css = open(CSS_PATH, 'r')

packed_xml = open(PACKED_XML_PATH, 'w')

packed_xml_str = xml.read()
packed_xml_str = packed_xml_str.replace(CSS_LINK, '<style>' + css.read() + '</style>')
packed_xml_str = packed_xml_str.replace(REDCLIFF_JS_LINK,
                       '<script type="text/javascript">' + redcliff_js.read() + '</script>')
packed_xml_str = packed_xml_str.replace(S2_JS_LINK,
                       '<script type="text/javascript">' + s2_js.read() + '</script>')
packed_xml.write(packed_xml_str)
packed_xml.close()
