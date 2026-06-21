"""Fix broken/expired thumbnail URLs in all courses."""

from pymongo import MongoClient

MONGO_URI = "mongodb+srv://nabeeljaved:nabeeljaved@cluster0.gsbme.mongodb.net/english"

FOCUS_FALLBACK = {
    "general":  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&w=800&q=80",
    "speaking": "https://images.unsplash.com/photo-1475721027187-402ad2989a3b?auto=format&w=800&q=80",
    "grammar":  "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&w=800&q=80",
    "ielts":    "https://images.unsplash.com/photo-1544650030-3c51ad04fe0b?auto=format&w=800&q=80",
    "business": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&w=800&q=80",
}

def is_broken(url):
    if not url:
        return True
    if "openai.com" in url or "chatgpt" in url.lower():
        return True
    if not url.startswith("https://images.unsplash.com") and not url.startswith("https://res.cloudinary.com"):
        return True
    return False

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=15000)
db = client["english"]

courses = list(db.courses.find({}))
fixed = 0
for c in courses:
    thumb = c.get("thumbnail") or ""
    if is_broken(thumb):
        focus = c.get("focus", "general")
        new_url = FOCUS_FALLBACK.get(focus, FOCUS_FALLBACK["general"])
        db.courses.update_one({"_id": c["_id"]}, {"$set": {"thumbnail": new_url}})
        print(f"Fixed [{c.get('status','?')}] {c['title'][:45]} [{focus}]")
        fixed += 1

print(f"\nDone. {fixed} course(s) fixed.")
client.close()
