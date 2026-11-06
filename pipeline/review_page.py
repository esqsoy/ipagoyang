"""영신 직검수 페이지(AGENTS, PRINCIPLES 7): 묶음 하나를 줄마다 댓글 다는 읽기 페이지로 만든다.

쓰는 법: python3 pipeline/review_page.py b01 --out <파일.html>
- 결과를 Artifact로 올린다. 올릴 때 capabilities: {comments: {}}. 줄을 누르면 입력칸이 열리고 Enter로 바로 Claude에게 간다.
  (줄 댓글 방식은 보카고양 pipeline/review-page.py에서 가져왔다. 26.10.11 영신: "라인바이라인으로 댓글달수 있게 해주고 엔터치면 바로 너에게 가는걸로")
- 원본은 data/·sources/다. 페이지는 생성물이라 손으로 고치지 않는다.
"""
import json, os, sys, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
E = html.escape


def rd(*p):
    path = os.path.join(ROOT, *p)
    return json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}


CSS = r'''<style>
/* 한 줄씩 읽고 누르는 검수 장부. 기호는 IPA 글꼴로 크게, 상태는 칩으로. */
:root{
  --bg:#f3f5f7;--surface:#ffffff;--ink:#1c232d;--muted:#596474;--line:#dbe1e8;
  --accent:#2c56c9;--accent-soft:#e6ecfb;--hot:#cf4f1c;--ok:#2a7f48;--ok-soft:#e1f2e7;--warn:#a35f00;--warn-soft:#fbefd9;
  --ko:"Noto Sans KR",-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;
  --ipa:"Charis SIL","Doulos SIL","Gentium Plus","Noto Serif",serif;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#11151b;--surface:#19202a;--ink:#e5eaf1;--muted:#9ba7b7;--line:#2b3441;
  --accent:#93abff;--accent-soft:#1f2a45;--hot:#ff8a57;--ok:#66c98a;--ok-soft:#173022;--warn:#e8a94a;--warn-soft:#3a2a12;color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#11151b;--surface:#19202a;--ink:#e5eaf1;--muted:#9ba7b7;--line:#2b3441;
  --accent:#93abff;--accent-soft:#1f2a45;--hot:#ff8a57;--ok:#66c98a;--ok-soft:#173022;--warn:#e8a94a;--warn-soft:#3a2a12;color-scheme:dark}
body{background:var(--bg);color:var(--ink);font-family:var(--ko);font-size:15px;line-height:1.6;word-break:keep-all}
.wrap{max-width:760px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:20px 48px;display:grid;gap:18px}
h1{font-size:1.5rem;margin:0;text-wrap:balance}
h2{font-size:1.08rem;margin:0 0 6px;text-wrap:balance}
.lede{color:var(--muted);margin:4px 0 0}
section{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px 16px;display:grid;gap:4px;min-width:0}
.item{border-top:1px solid var(--line);padding-top:10px;margin-top:6px;display:grid;gap:2px}
.item:first-of-type{border-top:0;margin-top:0;padding-top:0}
.head{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px}
.sym{font-family:var(--ipa);font-size:1.9rem;line-height:1.1}
.ipa{font-family:var(--ipa);font-size:1.08em}
.ipa b{color:var(--hot)}
.tag{font-size:.72rem;letter-spacing:.03em;color:var(--muted);text-transform:none}
.ln{padding:2px 0;min-width:0;overflow-wrap:anywhere}
.ln > b.k{font-weight:600;font-size:.74rem;letter-spacing:.03em;color:var(--accent);margin-right:6px}
.chip{display:inline-block;font-size:.72rem;font-weight:600;padding:1px 8px;border-radius:999px;margin-left:4px;vertical-align:1px}
.chip.ok{background:var(--ok-soft);color:var(--ok)}
.chip.warn{background:var(--warn-soft);color:var(--warn)}
.why{color:var(--muted);font-size:.86rem}
.hint{font-size:.86rem;color:var(--accent);background:var(--accent-soft);border-radius:10px;padding:8px 12px}
a{color:var(--accent)}
body.cm-on .ln{cursor:text;border-radius:6px;margin-inline:-6px;padding-inline:6px}
@media (hover:hover){body.cm-on .ln:hover{background:var(--accent-soft)}}
.ln.on{background:var(--accent-soft)}
.ln.sent{box-shadow:inset 3px 0 0 var(--accent)}
.cbox{display:grid;gap:6px;margin:2px 0 6px;padding:8px;border:1px solid var(--accent);border-radius:10px;background:var(--surface)}
.cbox textarea{font:inherit;font-size:16px;line-height:1.5;width:100%;min-height:44px;resize:none;border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--bg);color:var(--ink)}
.cbox textarea:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.cbox .row{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;justify-content:space-between}
.cbox .st{font-size:.78rem;color:var(--muted);min-width:0}
.cbox .st.ok{color:var(--accent)}
.cbox .st.err{color:var(--hot)}
.cbox .go{font:inherit;font-size:.84rem;border:0;border-radius:8px;background:var(--accent);color:var(--surface);padding:6px 14px;min-height:36px;cursor:pointer}
.cbox .go:disabled{opacity:.5;cursor:default}
.cbox .go:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
</style>'''

COMMENT_JS = r"""<script>(function(){
const hint=document.getElementById('cmhint');
const ERR={consent_required:'허락 창에서 허용해야 보낼 수 있어. 쓴 글은 그대로 뒀어.',
forbidden:'이 화면에선 페이지에서 댓글 달기가 꺼져 있어. 범위를 지정하는 기존 댓글로 달아 줘.',
rate_limited:'너무 빨리 보냈어. 잠깐 뒤에 Enter를 다시 눌러 줘.',
claude_unavailable:'Claude에게 바로 보내기가 지금 안 돼. 쓴 글은 그대로 뒀어.',
invalid:'글이 너무 길거나 쓸 수 없는 글자가 있어.'};
let cm=null,open=null,shift=false;
function say(box,msg,cls){const s=box.querySelector('.st');s.textContent=msg;s.className='st'+(cls?' '+cls:'');}
function closeBox(){if(!open)return;open.box.remove();open.line.classList.remove('on');open=null;}
function off(msg){document.body.classList.remove('cm-on');closeBox();hint.textContent=msg;}
async function send(o){
  const ta=o.box.querySelector('textarea'),go=o.box.querySelector('.go'),text=ta.value.trim();
  if(!text||o.busy)return;
  o.busy=true;ta.readOnly=true;go.disabled=true;say(o.box,'보내는 중…');
  try{
    const anchor=await cm.anchorFor(o.line);
    let can='off';try{can=await cm.canSendToClaude();}catch(_){}
    if(can==='available'){await cm.sendToClaude({anchor,text});say(o.box,'Claude에게 보냈어.','ok');}
    else{await cm.create({anchor,text});say(o.box,'댓글로 남겼어. 바로 보내기가 지금 안 돼서, 대화창에 "댓글 봐줘"라고 해 줘.','err');}
    o.line.classList.add('sent');ta.value='';
    setTimeout(()=>{if(open===o)closeBox();},1500);
  }catch(err){
    const c=err&&err.code;
    say(o.box,ERR[c]||'못 보냈어. 쓴 글은 그대로 뒀어. 잠깐 뒤에 Enter를 다시 눌러 줘.','err');
    if(c==='forbidden'||c==='not_granted'||c==='capability_disabled'||c==='capability_removed')setTimeout(()=>off('이 화면에선 줄 댓글이 꺼져 있어. 범위를 지정하는 기존 댓글로 달아 줘.'),2500);
  }finally{o.busy=false;ta.readOnly=false;go.disabled=false;}
}
function openBox(line){
  if(open&&open.line===line){open.box.querySelector('textarea').focus();return;}
  if(open&&open.box.querySelector('textarea').value.trim()){open.box.querySelector('textarea').focus();say(open.box,'쓰던 글이 있어. 보내거나 Esc로 닫고 옮겨 줘.','err');return;}
  closeBox();
  const name=line.dataset.name||'이 줄';
  const box=document.createElement('div');box.className='cbox';box.setAttribute('data-uncommentable','');
  box.innerHTML='<textarea rows="1" enterkeyhint="send" maxlength="1300"></textarea><div class="row"><span class="st">Enter로 바로 보내기 · 줄바꿈은 Shift+Enter · Esc 닫기</span><button type="button" class="go">보내기</button></div>';
  const ta=box.querySelector('textarea');ta.setAttribute('aria-label',name+'에 댓글');ta.placeholder=name+'에 대한 의견';
  line.after(box);line.classList.add('on');
  const o={line,box,busy:false};open=o;
  ta.addEventListener('keydown',ev=>{
    if(ev.key==='Shift')shift=true;
    if(ev.key==='Escape'){ev.preventDefault();closeBox();return;}
    if(ev.key==='Enter'&&!ev.shiftKey){if(ev.isComposing||ev.keyCode===229)return;ev.preventDefault();send(o);}
  });
  ta.addEventListener('keyup',ev=>{if(ev.key==='Shift')shift=false;});
  ta.addEventListener('beforeinput',ev=>{if((ev.inputType==='insertLineBreak'||ev.inputType==='insertParagraph')&&!shift){ev.preventDefault();send(o);}});
  ta.addEventListener('input',()=>{ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';});
  box.querySelector('.go').addEventListener('click',()=>send(o));
  ta.focus();
}
document.addEventListener('click',ev=>{
  if(!document.body.classList.contains('cm-on'))return;
  if(ev.target.closest('.cbox,a,button'))return;
  const line=ev.target.closest('.ln');if(!line)return;
  const sel=window.getSelection();if(sel&&!sel.isCollapsed)return;
  openBox(line);
});
(async()=>{
  try{cm=await window.claude.use('comments');}catch(_){cm=null;}
  if(!cm){hint.textContent='이 화면에선 줄 댓글을 쓸 수 없어. 범위를 지정하는 기존 댓글로 달아 줘.';return;}
  document.body.classList.add('cm-on');
  hint.textContent='줄을 누르면 입력칸이 열려. 쓰고 Enter를 누르면 바로 Claude에게 가. 줄바꿈은 Shift+Enter.';
})();
})();</script>"""


def chip(status):
    if not status:
        return ''
    return f'<span class="chip {"ok" if status == "확인" else "warn"}">{E(status)}</span>'


def ln(name, key, body, raw=False):
    return f'<div class="ln" data-name="{E(name)}"><b class="k">{E(key)}</b>{body if raw else E(body)}</div>'


def tr(w):
    a, t, b = w['ipa']
    return f'<span class="ipa">[{E(a)}<b>{E(t)}</b>{E(b)}]</span>'


def main():
    bid = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'b01'
    out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else None
    b = rd('data', 'bundles', bid + '.json')
    sy = rd('data', 'symbols.json')
    langs = {l['id']: l for l in rd('data', 'languages.json')['langs']}
    audio = {f['id']: f for f in rd('sources', 'audio.json')['files']}
    ph = {r['word']: r for r in rd('sources', f'phoible-{bid}.json').get('results', [])}
    wk = {r['word']: r for r in rd('sources', f'wiktionary-{bid}.json').get('rows', [])}
    refs = {r['id']: r for r in rd('sources', 'references.json')['refs']}
    P = ['<title>발음고양 묶음 1 검수</title><meta name="claude:viewport-fit-sides" content="cover">',
         '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Charis+SIL:wght@400;700&family=Noto+Sans+KR:wght@400;600;700&display=swap">',
         CSS, '<div class="wrap">',
         f'<header><h1>발음고양 묶음 1 · {E(b["title"])} <span class="ipa">{E(b["symbols_title"])}</span></h1>'
         '<p class="lede">시제품 직검수. 기호 설명·낱말 전사·근거·녹음·고양이 대사를 한 줄씩 본다. '
         '<span class="chip ok">확인</span>은 이 세션에서 출처와 대조한 것, <span class="chip warn">확인 필요</span>는 원문을 못 본 것이다.</p></header>',
         '<p class="hint" id="cmhint">줄 댓글을 준비하는 중…</p>']

    # 정할 것
    P.append('<section><h2>정할 것</h2>')
    P.append(ln('설계안 7 언어 풀', '설계안 7', '언어 풀: 11개 언어(라틴어·그리스어는 지금 뺌), 한국어는 모든 묶음에 기준, 묶음마다 한국어 + 3~4개, PHOIBLE로 기호×언어 표를 먼저 만들기. 추천대로 갈지?'))
    P.append(ln('설계안 8-4 추천 1', '설계안 8-4 ①', '입 옆모습을 CC0 단면도(Wright·McCloy, 음성학 교재용)로 바꾸고 좌우로 뒤집어 표 방향에 맞추기. 지금 그림은 Claude 모식도.'))
    P.append(ln('설계안 8-4 추천 2', '설계안 8-4 ②', '여러 화자로 듣기(HVPT): 낱말마다 녹음 2~3명, 듣고 고르기에서 화자를 섞기. 메타분석 근거 있음.'))
    P.append(ln('설계안 8-4 추천 3~5', '설계안 8-4 ③~⑤', '언어로 보기(언어를 고르면 그 언어 자음이 표에 켜짐)는 묶음 서너 개 뒤, 성조 곡선·마이크는 성조 묶음 때 논의, Seeing Speech 등은 링크로만.'))
    P.append(ln('한국어 녹음', '녹음', '한국어 불·풀·뿔·부부는 영신초이 녹음을 기다리며 소리 칸을 비워 뒀다. 공개 조건(CC0 / CC BY-SA 4.0)과 화자 설명(예: 서울·경기, 일산)을 정해 줘. 파일은 구글 드라이브나 저장소 incoming/ 폴더로.'))
    P.append(ln('청취 검수', '청취', '받은 녹음(영어 pin·spin·bin, [p] 기호 소리)을 미리보기에서 들어 보고, 이상한 게 있으면 그 줄에 적어 줘. 아직 사람이 들은 파일은 없다. 미리보기: https://claude.ai/artifact/3QPEUivENNJjCLp4vcTcJo'))
    P.append('</section>')

    # 기호
    P.append('<section><h2>기호 설명</h2>')
    for k in b['learn']:
        s = sy['symbols'][k]
        P.append(f'<div class="item"><div class="head"><span class="sym">{E(k)}</span><b>{E(s["name"])}</b>{chip(s.get("status"))}</div>')
        P.append(ln(f'[{k}] 내는 법', '내는 법', s['how']))
        P.append(ln(f'[{k}] 한국어와', '한국어와', s['ko']))
        if s.get('other'):
            P.append(ln(f'[{k}] 다른 표기', '다른 표기', s['other']))
        ev = '; '.join(f'{refs.get(e["src"], {}).get("id", e["src"])}: {e.get("note", "")}' for e in s.get('evidence', []))
        P.append(ln(f'[{k}] 근거', '근거', ev))
        if s.get('status_why'):
            P.append(f'<div class="why">{E(s["status_why"])}</div>')
        P.append('</div>')
    P.append('</section>')

    # 낱말
    P.append('<section><h2>낱말과 녹음</h2>')
    for w in b['words']:
        L = langs[w['lang']]
        P.append(f'<div class="item"><div class="head"><span class="tag">{E(L["ko"])} · {E(L["variety"])}</span>'
                 f'<b>{E(w["text"])}</b>{tr(w)}<span class="why">{E(w["ko"])}</span>{chip(w.get("status"))}</div>')
        if w.get('note'):
            P.append(ln(f'{w["text"]} 메모', '메모', w['note']))
        r = ph.get(w['id'], {})
        pv = f'목록 {r.get("inv")} 음소 {r.get("seg")}' + (f' · 변이음 {r.get("allo")}' if r.get('allo') else '') + (' · 맞음' if r.get('ok') else ' · 어긋남')
        P.append(ln(f'{w["text"]} PHOIBLE', 'PHOIBLE', pv))
        k2 = wk.get(w['id'], {})
        wv = ', '.join(k2.get('wiktionary', [])) or '없음'
        P.append(ln(f'{w["text"]} Wiktionary', 'Wiktionary', f'{wv} · 대상 소리 {"맞음" if k2.get("target_ok") else "확인 필요"}'))
        a = audio.get(w.get('audio'), {})
        got = '게임에 들어감' if a.get('mp3') else '아직 못 받음(요청 제한)'
        P.append(ln(f'{w["text"]} 녹음', '녹음',
                    f'<a href="{E(a.get("page", ""))}" target="_blank" rel="noopener">{E(a.get("commons_file", "없음"))}</a> · {E(a.get("author", ""))} · {E(a.get("license", ""))} · {E(a.get("speaker", ""))} · {got} · 청취 {"했음" if a.get("listened") else "대기"}', raw=True))
        P.append('</div>')
    P.append('</section>')

    # 견주기
    P.append('<section><h2>한국어와 견주기</h2>')
    for c in b['compare']:
        w = next(x for x in b['words'] if x['id'] == c['word'])
        P.append(f'<div class="item"><div class="head"><b>{E(w["text"])}</b>{tr(w)}{chip(c.get("status"))}</div>')
        P.append(ln(f'{w["text"]} 물음', '물음', f'{c["q"]} ({" · ".join(c["options"])}) → {c["answer"]}'))
        P.append(ln(f'{w["text"]} 풀이', '풀이', c['why']))
        P.append(f'<div class="why">{E(c.get("status_why", ""))}</div></div>')
    P.append('</section>')

    # 고양이·체감
    P.append('<section><h2>고양이 대사</h2>')
    L = b['lines']
    P.append(ln('시작 대사', '시작', L['start']))
    for i, t in enumerate(L['correct']):
        P.append(ln(f'맞힘 대사 {i + 1}', '맞힘', t))
    for i, t in enumerate(L['wrong']):
        P.append(ln(f'틀림 대사 {i + 1}', '틀림', t))
    for wid, t in L.get('by_word', {}).items():
        P.append(ln(f'{wid} 대사', wid, t))
    P.append(ln('끝 대사', '끝', L['end']))
    P.append('</section><section><h2>체감 연습</h2>')
    for i, f in enumerate(b.get('feel', [])):
        P.append(ln(f'체감 {i + 1}', ' · '.join(f['for']), f['text']))
    P.append('</section></div>')
    P.append(COMMENT_JS)
    page = '\n'.join(P)
    if out:
        open(out, 'w', encoding='utf-8').write(page)
        print(out, len(page))
    else:
        print(page)


if __name__ == '__main__':
    main()
