"""IPA 글꼴 만들기(PRINCIPLES 8-3): Charis SIL에서 IPA·라틴 글자만 남기고 이름을 바꾼다.

쓰는 법: python3 pipeline/font_subset.py <Charis-Regular.ttf> <Charis-Bold.ttf>
- Charis SIL은 SIL Open Font License 1.1이고 'Charis'·'SIL'이 예약 글꼴 이름이다. 글자를 줄이면 고친 글꼴이라
  예약 이름을 쓸 수 없어서 'Balum IPA'로 이름을 바꾼다. OFL 전문은 assets/fonts/OFL.txt.
- 원본 zip은 software.sil.org/charis(Charis-7.000.zip)에서 받는다. 저장소에는 결과 woff2만 넣는다.
"""
import sys, os
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RANGES = [(0x20, 0x7E), (0xA0, 0xFF), (0x100, 0x17F), (0x180, 0x24F), (0x250, 0x2AF), (0x2B0, 0x2FF), (0x300, 0x36F),
          (0x370, 0x3FF), (0x1D00, 0x1DBF), (0x1DC0, 0x1DFF), (0x1E00, 0x1EFF), (0x2010, 0x2027), (0x2190, 0x2193), (0xA700, 0xA71F)]

def build(src, dst, style):
    opts = subset.Options()
    opts.layout_features = ['*']
    opts.flavor = 'woff2'
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    f = TTFont(src)
    s = subset.Subsetter(opts)
    s.populate(unicodes=[c for a, b in RANGES for c in range(a, b + 1)])
    s.subset(f)
    fam = 'Balum IPA'
    for rec in f['name'].names:
        if rec.nameID in (1, 16):
            rec.string = fam
        elif rec.nameID == 4:
            rec.string = f'{fam} {style}'
        elif rec.nameID == 6:
            rec.string = f'BalumIPA-{style}'
        elif rec.nameID == 3:
            rec.string = f'BalumIPA-{style};subset of Charis 7.000'
    f.flavor = 'woff2'
    f.save(dst)
    print(dst, os.path.getsize(dst))

if __name__ == '__main__':
    build(sys.argv[1], os.path.join(ROOT, 'assets', 'fonts', 'BalumIPA-Regular.woff2'), 'Regular')
    build(sys.argv[2], os.path.join(ROOT, 'assets', 'fonts', 'BalumIPA-Bold.woff2'), 'Bold')
