#!/usr/bin/env python3
"""Download S51 headshots (Fandom) and photos (EW), update cast JSON."""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "survivor-51-cast.json"
HEADSHOTS = ROOT / "public" / "headshots"
PHOTOS = ROOT / "public" / "photos"

# Fandom S51_*_t.png (revision/latest + format=original → 90×90 PNG)
FANDOM = {
    "aaliyah-puglia": "https://static.wikia.nocookie.net/survivor/images/5/57/S51_aaliyah_t.png/revision/latest?cb=20260904163427&format=original",
    "alexis-levine": "https://static.wikia.nocookie.net/survivor/images/1/17/S51_alexis_t.png/revision/latest?cb=20260904163600&format=original",
    "an-thien-an-nguyen": "https://static.wikia.nocookie.net/survivor/images/9/93/S51_thienan_t.png/revision/latest?cb=20260904164904&format=original",
    "ana-sani": "https://static.wikia.nocookie.net/survivor/images/f/fc/S51_ana_t.png/revision/latest?cb=20260904163625&format=original",
    "angelica-jelly-loblack": "https://static.wikia.nocookie.net/survivor/images/8/83/S51_jelly_t.png/revision/latest?cb=20260904164125&format=original",
    "brady-booker": "https://static.wikia.nocookie.net/survivor/images/5/5b/S51_brady_t.png/revision/latest?cb=20260904163649&format=original",
    "carter-krull": "https://static.wikia.nocookie.net/survivor/images/e/e0/S51_carter_t.png/revision/latest?cb=20260904163714&format=original",
    "cristian-chavez": "https://static.wikia.nocookie.net/survivor/images/4/45/S51_cristian_t.png/revision/latest?cb=20260904163859&format=original",
    "danny-kilby": "https://static.wikia.nocookie.net/survivor/images/9/90/S51_kilby_t.png/revision/latest?cb=20260904163958&format=original",
    "devin-way": "https://static.wikia.nocookie.net/survivor/images/4/4d/S51_devin_t.png/revision/latest?cb=20260904164029&format=original",
    "eric-macksoud": "https://static.wikia.nocookie.net/survivor/images/4/49/S51_eric_t.png/revision/latest?cb=20260904164057&format=original",
    "jenna-doore": "https://static.wikia.nocookie.net/survivor/images/8/8f/S51_jenna_t.png/revision/latest?cb=20260904164259&format=original",
    "kristin-flickinger": "https://static.wikia.nocookie.net/survivor/images/d/d2/S51_kristin_t.png/revision/latest?cb=20260904164328&format=original",
    "lewis-kelly": "https://static.wikia.nocookie.net/survivor/images/d/dc/S51_lewis_t.png/revision/latest?cb=20260904164418&format=original",
    "linnea-capobianco": "https://static.wikia.nocookie.net/survivor/images/7/7a/S51_linnea_t.png/revision/latest?cb=20260904164448&format=original",
    "maggie-nestor": "https://static.wikia.nocookie.net/survivor/images/7/76/S51_maggie_t.png/revision/latest?cb=20260904164519&format=original",
    "mike-pinsky": "https://static.wikia.nocookie.net/survivor/images/d/d6/S51_mike_t.png/revision/latest?cb=20260904164652&format=original",
    "ori-jean-charles": "https://static.wikia.nocookie.net/survivor/images/4/4c/S51_ori_t.png/revision/latest?cb=20260904164718&format=original",
    "patt-cannaday": "https://static.wikia.nocookie.net/survivor/images/0/01/S51_patt_t.png/revision/latest?cb=20260904164750&format=original",
    "rob-antonson": "https://static.wikia.nocookie.net/survivor/images/b/ba/S51_rob_t.png/revision/latest?cb=20260904164815&format=original",
    "sharonda-cox": "https://static.wikia.nocookie.net/survivor/images/3/34/S51_sharonda_t.png/revision/latest?cb=20260904164838&format=original",
}

# EW 2000px-wide (largest offered in article lazy-load URLs)
EW = {
    "aaliyah-puglia": "https://ew.com/thmb/elDCwUFJPjMEyXUSZlK-76XRyFo=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-01-790e88d62e604cbda6f5f19b59d91b13.jpg",
    "alexis-levine": "https://ew.com/thmb/ao2bLAD-Rz_vRnZD3-zCpc3qGoo=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-02-a7ce9a9c80ac487198c25c6d13d86b53.jpg",
    "ana-sani": "https://ew.com/thmb/QrN9evtudMkaUBdbmHB-Q77q6XE=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-03-175baed745b7475da14ded004ccd075c.jpg",
    "brady-booker": "https://ew.com/thmb/Htomw-Q5yLo_XYuuMjMkmXU9zQs=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-04-25746d0986cc4b15b4a8da3e7cb74f47.jpg",
    "carter-krull": "https://ew.com/thmb/lZIonG9ZCyz8stIbKZ9-9MREl58=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-05-228faffee5d447e9b9648c00a4a4a8e9.jpg",
    "cristian-chavez": "https://ew.com/thmb/9ynWCnayXU4JvrD_uAajVkRD05g=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-06-52979d7c8587427aa470a84f3292d435.jpg",
    "eric-macksoud": "https://ew.com/thmb/2wm8Iukhf58pjNNPb1rfulA9JsU=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-07-594778d1d23544be9aee403062ca04dc.jpg",
    "jenna-doore": "https://ew.com/thmb/ytVA-AQPucU39OUISBe0Pa6k9vA=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-08-4513eb6175cf42c2a6c5a511de07b453.jpg",
    "kristin-flickinger": "https://ew.com/thmb/AJCnX9b44SCi8A2myq8ePAKK9lE=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-09-81481aa8ae7f4d8f8a1ada148e95d9bc.jpg",
    "lewis-kelly": "https://ew.com/thmb/eUk7pVF0USxQFgXF7pG2CLmEKmc=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-10-b3b9384f51ab45c6a596e8c32a4eb1ff.jpg",
    "linnea-capobianco": "https://ew.com/thmb/C7DNo8zp5iIj8YqwAlTVIIe02Us=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-11-cfffba23df26487e9fdb78ef5b5f538a.jpg",
    "maggie-nestor": "https://ew.com/thmb/cEFolLpdOSGrQA-3LOCOGzu2C2k=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-12-3f959d42be094f7d92a69a26f6305e28.jpg",
    "mike-pinsky": "https://ew.com/thmb/w8sC0EW4LEMVQmu2otIA8AyOQb8=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-13-9857413ef3ac4301b5fc37d368959392.jpg",
    "ori-jean-charles": "https://ew.com/thmb/kNEt1UR1jLhxBGcupN3F6bOmFzw=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-14-e76040ef13744706bc6be0204e670132.jpg",
    "patt-cannaday": "https://ew.com/thmb/I3y9XpV-efQkulPN4cab-aQTZFU=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-15-a0d5e80bef594f33bcdb48d57ba17081.jpg",
    "rob-antonson": "https://ew.com/thmb/BP3_DOtNVKH1ISZRrzU7hoKPZYc=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-16-cba6842a47cf487d9a5cc732090ae95f.jpg",
    "sharonda-cox": "https://ew.com/thmb/N0BrBlG-kJ3g1wbSjg6pysJORkE=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-17-d0a3523ab0484080afcd3bbcdb877583.jpg",
    "an-thien-an-nguyen": "https://ew.com/thmb/q0uDjQglUyD865UNMH2hXm37Hgo=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-18-32d004b090804720aeb4ff36c31249b8.jpg",
    "angelica-jelly-loblack": "https://ew.com/thmb/aFd19zeZic32blSNudnnGoTz_3I=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-19-84f5b92c5ce04c97ae96c34233a8d709.jpg",
    "danny-kilby": "https://ew.com/thmb/hDA9vUwL9T5xTIYHO5CIasJx5Bo=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-20-8225a80fea7f4fb3a05d71738e288103.jpg",
    "devin-way": "https://ew.com/thmb/WPO_YQrcClQmOegXeMBNZtQWan4=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Survivor-Full-21-d57a82aa970240b084e3ae996e13435a.jpg",
}


def slugify(name: str) -> str:
    name = name.replace("\u201c", " ").replace("\u201d", " ")
    name = re.sub(r'["\']', " ", name)
    parts = re.findall(r"[A-Za-z0-9]+", name)
    out: list[str] = []
    for p in parts:
        pl = p.lower()
        if out and out[-1] == pl:
            continue
        out.append(pl)
    return "-".join(out)


def download(url: str, dest: Path) -> None:
    if dest.exists() and dest.stat().st_size > 0:
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    last_err = None
    for attempt in range(5):
        try:
            subprocess.run(
                [
                    "curl",
                    "-fsSL",
                    "--max-time",
                    "120",
                    "--retry",
                    "2",
                    "--retry-delay",
                    "2",
                    "-A",
                    "Mozilla/5.0",
                    "-o",
                    str(dest),
                    url,
                ],
                check=True,
            )
            if dest.stat().st_size > 0:
                return
        except subprocess.CalledProcessError as exc:
            last_err = exc
            if dest.exists():
                dest.unlink(missing_ok=True)
    raise RuntimeError(f"Failed to download {url}") from last_err


def main() -> None:
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    slugs = [slugify(p["name"]) for p in data["cast"]]
    assert len(slugs) == 21
    assert set(slugs) == set(FANDOM.keys()) == set(EW.keys()), (set(slugs) - set(FANDOM.keys()), set(FANDOM.keys()) - set(slugs))

    from concurrent.futures import ThreadPoolExecutor, as_completed

    jobs = []
    with ThreadPoolExecutor(max_workers=6) as pool:
        for slug in slugs:
            jobs.append(
                pool.submit(download, FANDOM[slug], HEADSHOTS / f"{slug}.png")
            )
            jobs.append(pool.submit(download, EW[slug], PHOTOS / f"{slug}.webp"))
        for job in as_completed(jobs):
            job.result()

    for player in data["cast"]:
        slug = slugify(player["name"])
        player["headshot"] = f"{slug}.png"
        player["photo"] = f"{slug}.webp"

    JSON_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Downloaded {len(slugs)} headshots and photos; updated {JSON_PATH.name}")


if __name__ == "__main__":
    main()
