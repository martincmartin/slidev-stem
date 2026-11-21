import subprocess, sys, re
files = subprocess.run(["git","diff","--name-only","HEAD"],capture_output=True,text=True).stdout.split()
files=[f for f in files if re.search(r"\.(ts|mts|vue|css)$",f) and "test" not in f]
def count(text):
    code=comment=blank=0; inblock=False
    for line in text.splitlines():
        s=line.strip()
        if not s: blank+=1; continue
        if inblock:
            comment+=1
            if "*/" in s: inblock=False
            continue
        if s.startswith("//"): comment+=1; continue
        if s.startswith("/*") or s.startswith("<!--"):
            comment+=1
            if "*/" not in s and "-->" not in s: inblock=s.startswith("/*")
            continue
        code+=1
    return code,comment
tot={"before":[0,0],"after":[0,0]}
for f in files:
    before=subprocess.run(["git","show",f"HEAD:{f}"],capture_output=True,text=True).stdout
    after=open(f).read()
    for k,t in (("before",before),("after",after)):
        c,m=count(t); tot[k][0]+=c; tot[k][1]+=m
print(len(files),"files (not tests)")
for k in tot: print(k,"code",tot[k][0],"comment",tot[k][1])
print("delta code",tot["after"][0]-tot["before"][0],"comment",tot["after"][1]-tot["before"][1])
