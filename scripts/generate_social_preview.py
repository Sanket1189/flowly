from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "social-preview.png"
WIDTH, HEIGHT = 1200, 627


def font(name: str, size: int):
    path = Path("C:/Windows/Fonts") / name
    return ImageFont.truetype(str(path), size=size)


canvas = Image.new("RGB", (WIDTH, HEIGHT), "#f3f5ef")
draw = ImageDraw.Draw(canvas)

# Soft background shapes keep the card recognisable at small preview sizes.
draw.ellipse((875, -190, 1310, 245), fill="#dff0e5")
draw.ellipse((-135, 425, 180, 740), fill="#e5eef7")

# Brand mark and wordmark.
draw.rounded_rectangle((70, 58, 132, 120), radius=21, fill="#153f35")
draw.ellipse((89, 77, 113, 101), outline="#d8ff5f", width=5)
draw.ellipse((97, 85, 105, 93), fill="#d8ff5f")
draw.text((151, 60), "flowly.", font=font("arialbd.ttf", 42), fill="#153f35")
draw.rounded_rectangle((960, 66, 1114, 108), radius=21, fill="#e3efdd")
draw.text((988, 78), "8 workflows", font=font("arialbd.ttf", 16), fill="#153f35")

# Primary message.
draw.text((70, 170), "Whatever’s next,", font=font("arialbd.ttf", 66), fill="#153f35")
draw.text((70, 244), "there’s a flow for it.", font=font("arialbd.ttf", 66), fill="#153f35")
draw.text(
    (74, 337),
    "Thoughtful, private tools for plans you can make yourself.",
    font=font("arial.ttf", 25),
    fill="#647c75",
)

items = [
    ("Trip planner", "#f37a5d", "#fff0ea"),
    ("Money planning", "#153f35", "#e2efe6"),
    ("Study planner", "#765f91", "#eee8f5"),
    ("Daily routine", "#a65e49", "#f4e5df"),
]
x = 70
for label, accent, background in items:
    width = 236 if label != "Money planning" else 258
    draw.rounded_rectangle((x, 426, x + width, 512), radius=26, fill=background)
    draw.ellipse((x + 20, 450, x + 42, 472), fill=accent)
    draw.text((x + 56, 447), label, font=font("arialbd.ttf", 19), fill="#153f35")
    x += width + 18

draw.rounded_rectangle((70, 552, 1130, 556), radius=2, fill="#cfdbd4")
draw.text((70, 577), "PLAN • CUSTOMISE • EXPORT", font=font("arialbd.ttf", 14), fill="#728980")
draw.text((1000, 575), "flowly", font=font("arialbd.ttf", 18), fill="#153f35")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUTPUT, optimize=True)
print(OUTPUT)
