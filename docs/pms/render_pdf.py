from pathlib import Path
import re,html,textwrap
from reportlab.platypus import BaseDocTemplate,PageTemplate,Frame,Paragraph,Spacer,PageBreak,Table,TableStyle,Flowable,KeepTogether
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing,Rect,String,Line,Polygon
BASE=Path(__file__).parent
for name,file in [('Body','Arial.ttf'),('BodyBold','Arial Bold.ttf'),('BodyItalic','Arial Italic.ttf'),('Mono','Courier New.ttf')]:
 p=Path('/System/Library/Fonts/Supplemental')/file
 if p.exists():pdfmetrics.registerFont(TTFont(name,str(p)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='BodyBold',italic='BodyItalic',boldItalic='BodyBold')
INK=colors.HexColor('#19392f');ACC=colors.HexColor('#ad8a43');MUTED=colors.HexColor('#61716a');PALE=colors.HexColor('#f1f5f2');BORDER=colors.HexColor('#dbe4dc')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='Text',fontName='Body',fontSize=9,leading=13.5,spaceAfter=7,textColor=colors.HexColor('#25372f')))
styles.add(ParagraphStyle(name='H1x',fontName='BodyBold',fontSize=22,leading=27,spaceAfter=16,textColor=INK,keepWithNext=True))
styles.add(ParagraphStyle(name='H2x',fontName='BodyBold',fontSize=14,leading=18,spaceBefore=15,spaceAfter=9,textColor=INK,keepWithNext=True))
styles.add(ParagraphStyle(name='H3x',fontName='BodyBold',fontSize=10.5,leading=15,spaceBefore=13,spaceAfter=8,textColor=INK,keepWithNext=True))
styles.add(ParagraphStyle(name='Cell',fontName='Body',fontSize=7.5,leading=10.5,wordWrap='CJK'))
styles.add(ParagraphStyle(name='CellHead',fontName='BodyBold',fontSize=7.5,leading=10.5,textColor=colors.white))
styles.add(ParagraphStyle(name='CodeX',fontName='Mono',fontSize=7,leading=10,backColor=PALE,borderPadding=8,spaceAfter=0,wordWrap='CJK'))
styles.add(ParagraphStyle(name='CoverTitle',fontName='BodyBold',fontSize=32,leading=40,textColor=INK,spaceAfter=20))
styles.add(ParagraphStyle(name='CoverSub',fontName='Body',fontSize=17,leading=25,textColor=MUTED,spaceAfter=25))
def inline(t):
 t=html.escape(t)
 t=re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',t)
 t=re.sub(r'`([^`]+)`',r'<font name="Mono">\1</font>',t)
 return t
W,H=595.28,841.89; M=45; CW=W-2*M
class Doc(BaseDocTemplate):
 def __init__(self,p):
  super().__init__(str(p),pagesize=(W,H),leftMargin=M,rightMargin=M,topMargin=52,bottomMargin=48,title='Hotel Management System (PMS) — Complete Technical Documentation',author='KnockOUT technical handover',allowSplitting=True)
  self.addPageTemplates(PageTemplate(id='main',frames=[Frame(M,48,CW,H-100,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=self.page))
 def page(self,c,d):
  c.saveState()
  if d.page>1:
   c.setStrokeColor(BORDER);c.line(M,H-34,W-M,H-34)
   c.setFillColor(MUTED);c.setFont('Body',7);c.drawString(M,H-26,'KNOCKOUT  /  TECHNICAL HANDOVER');c.drawRightString(W-M,H-26,'VERSION 1.0 · 04 OCT 2026')
  c.setStrokeColor(BORDER);c.line(M,34,W-M,34)
  c.setFont('Body',7);c.setFillColor(MUTED);c.drawString(M,22,'SOURCE-VERIFIED • INTERNAL • RECOMMENDATIONS LABELED');c.drawRightString(W-M,22,f'{d.page:03d}')
  c.restoreState()
 def afterFlowable(self,f):
  if isinstance(f,Paragraph) and getattr(f,'headingLevel',None) is not None:
   text=f.getPlainText();key='h'+str(f.headingId);self.canv.bookmarkPage(key)
   level=f.headingLevel;self.canv.addOutlineEntry(text,key,level=level,closed=True)
   if level<=1:self.notify('TOCEntry',(level,text,self.page,key))
def arrow(d,x1,y1,x2,y2,color=MUTED):
 d.add(Line(x1,y1,x2,y2,strokeColor=color,strokeWidth=.8))
 import math
 a=math.atan2(y2-y1,x2-x1);z=4
 pts=[x2,y2,x2-z*math.cos(a-.55),y2-z*math.sin(a-.55),x2-z*math.cos(a+.55),y2-z*math.sin(a+.55)]
 d.add(Polygon(pts,fillColor=color,strokeColor=color))
def box(d,x,y,w,h,label):
 d.add(Rect(x,y,w,h,rx=5,ry=5,fillColor=PALE,strokeColor=BORDER))
 lines=textwrap.wrap(label,max(12,int(w/4.3)))
 for i,l in enumerate(lines):d.add(String(x+w/2,y+h/2+(len(lines)-1)*5-i*10,l,fontName='BodyBold',fontSize=8,fillColor=INK,textAnchor='middle'))
def diagram(code):
 lines=code.strip().splitlines()
 if lines[0]=='sequenceDiagram':
  people=[];events=[]
  for l in lines[1:]:
   m=re.search(r'participant (\w+) as (.+)',l)
   if m:people.append((m[1],m[2]))
   m=re.search(r'(\w+)(?:-->>|->>)(\w+): (.+)',l)
   if m:events.append(m.groups())
  height=85+len(events)*37;d=Drawing(CW,height);pos={a:30+i*(CW-60)/max(1,len(people)-1) for i,(a,b) in enumerate(people)}
  for a,b in people:
   x=pos[a];box(d,max(0,min(CW-105,x-52)),height-35,105,30,b);d.add(Line(x,15,x,height-38,strokeColor=BORDER,strokeDashArray=[3,3]))
  for i,(a,b,label) in enumerate(events):
   y=height-65-i*37;x1,x2=pos[a],pos[b]
   if a==b:arrow(d,x1,y,x1+30,y);arrow(d,x1+30,y-10,x1,y-10)
   else:arrow(d,x1,y,x2,y)
   for j,l in enumerate(textwrap.wrap(label,74)):d.add(String(CW/2,y+8+j*9,l,fontName='Body',fontSize=7.3,fillColor=INK,textAnchor='middle'))
  return d
 if lines[0]=='erDiagram':
  edges=[]
  for l in lines[1:]:
   m=re.search(r'(\w+)\s+([o|{}\-]+)\s+(\w+)\s*:\s*(.+)',l)
   if m:edges.append(m.groups())
  height=len(edges)*47+25;d=Drawing(CW,height)
  for i,(a,card,b,fk) in enumerate(edges):
   y=height-45-i*47;box(d,0,y,162,32,a);box(d,CW-178,y,178,32,b);arrow(d,164,y+12,CW-180,y+12)
   label=('0..1' if card.startswith('o|') else '1')+' to 0..many'
   d.add(String((CW-16)/2,y+24,label,fontName='Body',fontSize=7,fillColor=MUTED,textAnchor='middle'));d.add(String((CW-16)/2,y+2,fk,fontName='Body',fontSize=7,fillColor=INK,textAnchor='middle'))
  return d
 # Architecture diagram based on exact Mermaid edges; layered fixed source node groups.
 nodes={};edges=[]
 for l in lines[1:]:
  m=re.search(r'(\w+)(?:\[([^]]+)\])? --> (\w+)(?:\[([^]]+)\])?',l)
  if m:
   a,al,b,bl=m.groups();nodes[a]=al or nodes.get(a,a);nodes[b]=bl or nodes.get(b,b);edges.append((a,b))
 layers=[['Browser','Mobile'],['Web'],['Master'],['Admin','Waiter','Chef','Juicer'],['Catalog','Tenants','Redis','Objects'],['SMS','Notices']]
 height=410;d=Drawing(CW,height);pos={}
 for j,row in enumerate(layers):
  bw=min(148,(CW-12*(len(row)-1))/len(row));total=bw*len(row)+12*(len(row)-1);start=(CW-total)/2
  for i,n in enumerate(row):pos[n]=(start+i*(bw+12),height-45-j*67,bw,38)
 for a,b in edges:
  if a in pos and b in pos:
   x,y,w,h=pos[a];xx,yy,ww,hh=pos[b];arrow(d,x+w/2,y,xx+ww/2,yy+hh)
 for n,(x,y,w,h) in pos.items():box(d,x,y,w,h,nodes.get(n,n))
 return d
text=(BASE/'Hotel_Management_System_Complete_Documentation.md').read_text()
lines=text.splitlines();story=[]
story+=[Spacer(1,55),Paragraph('KNOCKOUT / HOSPITALITY',styles['H2x']),Spacer(1,26),Paragraph('HOTEL MANAGEMENT<br/>SYSTEM (PMS)',styles['CoverTitle']),Paragraph('Complete Technical, Architecture,<br/>Deployment &amp; Operations Documentation',styles['CoverSub'])]
cover=[('DOCUMENT','Technical handover · version 1.0'),('GENERATED','4 October 2026 · Asia/Kolkata'),('APPLICATION','KnockOUT · root package 2.0.0'),('REPOSITORY','a8b3d69a9f0569d537d3d21bee32544a298d94a0'),('SNAPSHOT','Working tree, including uncommitted mobile changes'),('SCOPE','Source analysis; not live production certification')]
for k,v in cover:story.append(Paragraph('<b>'+k+'</b><br/>'+inline(v),styles['Text']));story.append(Spacer(1,9))
story.append(Spacer(1,20));story.append(Paragraph('INTERNAL · No real credentials included<br/>Observed implementation and proposed improvements are distinguished throughout.',styles['Text']));story.append(PageBreak())
story.append(Paragraph('Contents',styles['H1x']));toc=TableOfContents();toc.levelStyles=[ParagraphStyle(name='toc0',fontName='BodyBold',fontSize=9,leading=14,spaceBefore=5,textColor=INK),ParagraphStyle(name='toc1',fontName='Body',fontSize=8,leading=12,leftIndent=12,textColor=MUTED)];story.append(toc);story.append(PageBreak())
i=next(i for i,l in enumerate(lines) if l.startswith('## 1. '));hid=0
while i<len(lines):
 line=lines[i]
 if not line.strip():i+=1;continue
 if line.startswith('```'):
  language=line[3:].strip();i+=1;block=[]
  while i<len(lines) and not lines[i].startswith('```'):block.append(lines[i]);i+=1
  if language=='mermaid':story.append(diagram('\n'.join(block)));story.append(Spacer(1,12))
  else:
   for l in block:
    for wrap in textwrap.wrap(l,width=108,replace_whitespace=False,drop_whitespace=False) or [' ']:story.append(Paragraph(html.escape(wrap).replace(' ','&#160;'),styles['CodeX']))
   story.append(Spacer(1,12))
  i+=1;continue
 if line.startswith('|'):
  data=[]
  while i<len(lines) and lines[i].startswith('|'):
   l=lines[i];i+=1
   if re.match(r'^\|[\s:|\-]+\|$',l):continue
   data.append([x.strip() for x in l.strip('|').split('|')])
  n=len(data[0]); widths=[CW/n]*n
  if n==2:widths=[CW*.27,CW*.73]
  if n==4:widths=[CW*.18,CW*.22,CW*.24,CW*.36]
  if n>=6:widths=[CW/n]*n
  cells=[[Paragraph(inline(c),styles['CellHead'] if j==0 else styles['Cell']) for c in row] for j,row in enumerate(data)]
  t=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),INK),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,PALE]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LINEBELOW',(0,0),(-1,0),.8,ACC),('LINEBELOW',(0,1),(-1,-1),.3,BORDER)]));story.append(t);story.append(Spacer(1,10));continue
 if line.startswith('##'):
  depth=len(line)-len(line.lstrip('#'));title=line[depth:].strip()
  if depth==2 and hid>0:story.append(PageBreak())
  style={2:'H1x',3:'H2x',4:'H3x'}.get(depth,'H3x');para=Paragraph(inline(title),styles[style]);para.headingLevel=depth-2;para.headingId=hid;hid+=1;story.append(para);i+=1;continue
 if line.startswith('- '):story.append(Paragraph('• '+inline(line[2:]),styles['Text']));i+=1;continue
 para=[line];i+=1
 while i<len(lines) and lines[i].strip() and not lines[i].startswith(('#','|','```','- ')):para.append(lines[i]);i+=1
 story.append(Paragraph(inline(' '.join(para)),styles['Text']))
doc=Doc(BASE/'Hotel_Management_System_Complete_Documentation.pdf');doc.multiBuild(story)
print('PDF generated:',BASE/'Hotel_Management_System_Complete_Documentation.pdf')
