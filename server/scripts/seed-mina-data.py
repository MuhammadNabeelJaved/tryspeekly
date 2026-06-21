"""
Seed script: Add sample enrolled students + approved reviews
to all courses taught by Mina Rahman Khan.
"""

from pymongo import MongoClient, UpdateOne
from bson import ObjectId
from datetime import datetime
import random

MONGO_URI = "mongodb+srv://nabeeljaved:nabeeljaved@cluster0.gsbme.mongodb.net/english"
DB_NAME   = "english"

SAMPLE_REVIEWS = [
    { "name": "Ayesha Malik",   "image": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80", "rating": 5, "content": "Mina is an absolutely wonderful teacher! Her explanations are crystal clear and she always makes sure every student understands before moving on. My English improved significantly within just a few weeks." },
    { "name": "Bilal Ahmed",    "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80", "rating": 5, "content": "I was very nervous about speaking English but Mina's patient and encouraging approach helped me gain real confidence. The sessions are well-structured and very interactive." },
    { "name": "Sana Tariq",     "image": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80", "rating": 4, "content": "Excellent course! Mina covers everything thoroughly. I especially loved the speaking practice exercises. Would highly recommend to anyone wanting to improve their fluency." },
    { "name": "Usman Chaudhry","image": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80", "rating": 5, "content": "One of the best English courses I have taken. Mina is very professional and knowledgeable. She identifies your weak points right away and works on them effectively." },
    { "name": "Fatima Noor",    "image": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80", "rating": 5, "content": "I enrolled for IELTS preparation and the results were amazing. Mina's tips and strategies are practical and directly applicable. I achieved my target band score!" },
    { "name": "Hassan Raza",    "image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80", "rating": 4, "content": "Very good course. The lessons are engaging and Mina is always available to answer questions. My business English has improved a lot and I feel much more confident in meetings." },
    { "name": "Zara Hussain",   "image": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80", "rating": 5, "content": "Mina is genuinely passionate about teaching. She goes above and beyond to help her students succeed. The course material is well-organised and the pace is perfect." },
    { "name": "Kamran Iqbal",   "image": "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80", "rating": 5, "content": "Highly recommend this course to everyone! Mina breaks down complex grammar rules into simple, easy-to-remember concepts. My spoken English has improved dramatically." },
    { "name": "Nadia Saeed",    "image": "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=100&q=80", "rating": 4, "content": "Great experience overall. The interactive sessions kept me engaged throughout. Mina's feedback is always constructive and encouraging. Worth every penny!" },
    { "name": "Tariq Mehmood",  "image": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&q=80", "rating": 5, "content": "I was struggling with grammar for years but Mina made it so easy to understand. Her teaching style is unique and very effective. Five stars without any hesitation." },
    { "name": "Mariam Shahid",  "image": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80", "rating": 5, "content": "Absolutely loved this course. Mina is very thorough and covers all aspects of the language. The progress I made in just two months is remarkable. Thank you Mina!" },
    { "name": "Adeel Farooq",   "image": "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=100&q=80", "rating": 4, "content": "Really solid course. The content is comprehensive and Mina delivers it in a very friendly and approachable manner. I now feel comfortable speaking English in professional settings." },
]

def run():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=15000)
    db = client[DB_NAME]

    users_col       = db["users"]
    courses_col     = db["courses"]
    enrollments_col = db["enrollments"]
    reviews_col     = db["reviews"]

    # 1. Find Mina Rahman Khan — list all teachers with 'mina' so user can confirm
    import re
    candidates = list(users_col.find(
        {"name": re.compile(r"\bmina\b", re.IGNORECASE), "role": "teacher"},
        {"_id": 1, "name": 1, "email": 1}
    ))
    print(f"[search] Teachers matching 'mina': {[(str(c['_id']), c['name']) for c in candidates]}")

    mina = None
    for c in candidates:
        if re.search(r"mina\s+rahman", c["name"], re.IGNORECASE):
            mina = users_col.find_one({"_id": c["_id"]})
            break
    if not mina and candidates:
        mina = users_col.find_one({"_id": candidates[0]["_id"]})
    if not mina:
        print("[error] Could not find instructor. Check the name in DB.")
        return
    print(f"[instructor] Using: {mina['name']} ({mina['_id']})")

    # 2. Find all her courses
    courses = list(courses_col.find({"teacher": mina["_id"], "isDeleted": {"$ne": True}}))
    if not courses:
        print("❌ No courses found for this instructor.")
        return
    print(f"[courses] Found {len(courses)} course(s):")
    for c in courses:
        print(f"   • {c['title']} ({c['_id']})")

    # 3. Find real student users to use as authors (need real ObjectIds)
    students = list(users_col.find({"role": "student"}, {"_id": 1, "name": 1}).limit(20))
    print(f"[students] Found {len(students)} student(s) available")

    if not students:
        print("❌ No student users found. Cannot create enrollments/reviews without real user IDs.")
        return

    # 4. Process each course
    for course in courses:
        print(f"\n[processing] \"{course['title']}\"")
        existing_enrolled = set(str(s) for s in (course.get("enrolledStudents") or []))
        total_sessions    = course.get("totalSessions", 12)

        # Pick students for this course (8–14 range)
        count    = min(8 + random.randint(0, 6), len(students))
        pool     = students[:count]

        # ── Enrollments ───────────────────────────────────────────
        new_ids = []
        for s in pool:
            if str(s["_id"]) in existing_enrolled:
                continue
            try:
                enrollments_col.insert_one({
                    "student":    s["_id"],
                    "course":     course["_id"],
                    "teacher":    mina["_id"],
                    "enrolledAt": datetime.utcnow(),
                    "isActive":   True,
                    "progress":   {"sessionsAttended": 0, "totalSessions": total_sessions},
                    "createdAt":  datetime.utcnow(),
                    "updatedAt":  datetime.utcnow(),
                })
                new_ids.append(s["_id"])
            except Exception as e:
                if "E11000" not in str(e):
                    print(f"   ⚠️  Enrollment error for {s['_id']}: {e}")

        if new_ids:
            courses_col.update_one(
                {"_id": course["_id"]},
                {"$addToSet": {"enrolledStudents": {"$each": new_ids}}}
            )
            print(f"   [ok] Added {len(new_ids)} enrolled student(s)")
        else:
            print(f"   [skip] All students already enrolled")

        # ── Reviews ───────────────────────────────────────────────
        review_count = 4 + random.randint(0, 2)
        added = 0
        for i in range(min(review_count, len(pool), len(SAMPLE_REVIEWS))):
            student = pool[i]
            sample  = SAMPLE_REVIEWS[i % len(SAMPLE_REVIEWS)]

            # Check if review already exists
            exists = reviews_col.find_one({
                "author": student["_id"],
                "course": course["_id"],
                "type":   "course",
            })
            if exists:
                continue

            try:
                reviews_col.insert_one({
                    "type":        "course",
                    "author":      student["_id"],
                    "course":      course["_id"],
                    "rating":      sample["rating"],
                    "content":     sample["content"],
                    "status":      "approved",
                    "authorName":  sample["name"],
                    "authorImage": sample["image"],
                    "authorRole":  "student",
                    "isDeleted":   False,
                    "createdAt":   datetime.utcnow(),
                    "updatedAt":   datetime.utcnow(),
                })
                added += 1
            except Exception as e:
                if "E11000" not in str(e):
                    print(f"   ⚠️  Review error: {e}")

        print(f"   [ok] Added {added} review(s)")

    print("\n[done] All courses updated successfully!")
    client.close()

if __name__ == "__main__":
    run()
