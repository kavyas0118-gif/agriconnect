"""
FARM2HOME — Python Flask Web Application
Full frontend in HTML/CSS/JS served by Flask.
Connects to Supabase for all real data.
"""

import os
from flask import Flask, render_template, jsonify, request, session, redirect, url_for
from flask_cors import CORS
from supabase import create_client, Client
from functools import wraps

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "farm2home-secret-2026")
CORS(app)

# ── Supabase ──────────────────────────────────────────────────────────────────
SUPABASE_URL = "https://iqqwluznjbbeosfkctsa.supabase.co"
SUPABASE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxcXdsdXpuamJiZW9zZmtjdHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjkyODUsImV4cCI6MjA5MDc0NTI4NX0"
    ".FVihYUC8KLuMp7xWj_0JS8ecy_7ftqAOSmjjZ7CeLV0"
)
sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Mock products (fallback when DB is empty) ─────────────────────────────────
MOCK_PRODUCTS = [
    {"id":"m1","name":"Fresh Tomatoes","category":"vegetables","price":35,"marketPrice":55,"unit":"kg","quantity":500,"organic":True,"image":"🍅","farmer":{"name":"Ravi Kumar","location":"Andhra Pradesh","distance":12,"rating":4.8,"verified":True,"crops":8},"rating":4.8,"reviews":124,"description":"Sun-ripened hybrid tomatoes directly from the farm."},
    {"id":"m2","name":"Organic Potatoes","category":"vegetables","price":28,"marketPrice":42,"unit":"kg","quantity":800,"organic":True,"image":"🥔","farmer":{"name":"Sunita Devi","location":"Uttar Pradesh","distance":8,"rating":4.9,"verified":True,"crops":5},"rating":4.9,"reviews":89,"description":"Washed and graded potatoes, perfect for daily cooking."},
    {"id":"m3","name":"Red Onions","category":"vegetables","price":22,"marketPrice":38,"unit":"kg","quantity":1200,"organic":False,"image":"🧅","farmer":{"name":"Mohan Reddy","location":"Karnataka","distance":15,"rating":4.7,"verified":True,"crops":6},"rating":4.7,"reviews":201,"description":"Premium quality red onions with rich flavour."},
    {"id":"m4","name":"Fresh Carrots","category":"vegetables","price":40,"marketPrice":62,"unit":"kg","quantity":300,"organic":True,"image":"🥕","farmer":{"name":"Priya Singh","location":"Himachal Pradesh","distance":22,"rating":4.6,"verified":True,"crops":4},"rating":4.6,"reviews":67,"description":"Crunchy orange carrots, freshly harvested."},
    {"id":"m5","name":"Basmati Rice","category":"grains","price":85,"marketPrice":120,"unit":"kg","quantity":2000,"organic":False,"image":"🌾","farmer":{"name":"Harjit Singh","location":"Punjab","distance":45,"rating":4.9,"verified":True,"crops":3},"rating":4.9,"reviews":312,"description":"Long-grain aromatic basmati rice, aged 1 year."},
    {"id":"m6","name":"Alphonso Mangoes","category":"fruits","price":180,"marketPrice":280,"unit":"kg","quantity":150,"organic":True,"image":"🥭","farmer":{"name":"Suresh Patil","location":"Maharashtra","distance":60,"rating":5.0,"verified":True,"crops":2},"rating":5.0,"reviews":445,"description":"GI-tagged Alphonso mangoes from Ratnagiri."},
    {"id":"m7","name":"Green Chillies","category":"spices","price":55,"marketPrice":80,"unit":"kg","quantity":400,"organic":False,"image":"🌶️","farmer":{"name":"Venkat Rao","location":"Telangana","distance":18,"rating":4.5,"verified":True,"crops":7},"rating":4.5,"reviews":98,"description":"Medium-hot green chillies from Guntur belt."},
    {"id":"m8","name":"Spinach","category":"vegetables","price":30,"marketPrice":50,"unit":"bunch","quantity":600,"organic":True,"image":"🥬","farmer":{"name":"Meena Bai","location":"Rajasthan","distance":30,"rating":4.7,"verified":True,"crops":9},"rating":4.7,"reviews":156,"description":"Tender baby spinach, picked fresh every morning."},
]

MOCK_BLOGS = [
    {"id":"b1","title":"10 Proven Tips to Double Your Tomato Yield","excerpt":"Science-backed techniques local farmers use to dramatically increase yields.","image":"🍅","author":"Dr. Anand Raju","authorRole":"Agricultural Scientist","date":"2026-04-01","readTime":6,"category":"Farming Tips","tags":["tomatoes","yield","tips"],"likes":148},
    {"id":"b2","title":"Complete Guide to Organic Rice Cultivation","excerpt":"Walk through every step of organic rice farming from seed to harvest.","image":"🌾","author":"Sunita Devi","authorRole":"Organic Farmer","date":"2026-03-28","readTime":8,"category":"Organic Farming","tags":["rice","organic"],"likes":213},
    {"id":"b3","title":"April–June Crop Calendar: What to Plant This Summer","excerpt":"Optimal crop choices, sowing windows, and expected market demand.","image":"📅","author":"Farm2Home Editorial","authorRole":"Editorial Team","date":"2026-03-25","readTime":5,"category":"Seasonal Guide","tags":["seasonal","summer"],"likes":94},
    {"id":"b4","title":"Why Onion Prices Crashed — And What Farmers Can Do","excerpt":"Analysis of the Feb 2026 price crash with data across mandis.","image":"🧅","author":"Mohan Rao","authorRole":"Market Analyst","date":"2026-03-18","readTime":7,"category":"Market Trends","tags":["onion","market","price"],"likes":176},
    {"id":"b5","title":"Integrated Pest Management for Vegetable Crops","excerpt":"Reduce pest damage by 70% while keeping produce organic-certifiable.","image":"🌿","author":"Dr. Priya Sharma","authorRole":"Extension Officer","date":"2026-03-10","readTime":9,"category":"Crop Management","tags":["IPM","pest","organic"],"likes":132},
    {"id":"b6","title":"Drip Irrigation Setup Guide for Small Farmers (Under ₹15,000)","excerpt":"Affordable drip irrigation guide for 1–2 acre farms.","image":"💧","author":"Venkat Reddy","authorRole":"Progressive Farmer","date":"2026-03-05","readTime":6,"category":"Farming Tips","tags":["irrigation","drip","water"],"likes":267},
]

# ── API Routes ─────────────────────────────────────────────────────────────────

@app.route("/api/products")
def api_products():
    try:
        res = sb.table("products").select("*").execute()
        db = res.data or []
        if not db:
            return jsonify(MOCK_PRODUCTS)
        mapped = []
        for p in db:
            mp = round(float(p["price"]) * 1.4)
            mapped.append({
                "id": p["id"], "name": p["name"], "category": p.get("category","vegetables"),
                "price": float(p["price"]), "marketPrice": mp, "unit": p.get("unit","kg"),
                "quantity": int(p.get("quantity",0)), "organic": bool(p.get("is_organic",False)),
                "image": _emoji(p["name"]), "description": p.get("description",""),
                "farmer": {"name": "Local Farmer","location": p.get("location","India"),
                           "distance": 0, "rating": 5.0, "verified": True, "crops": 1},
                "rating": 5.0, "reviews": 0,
            })
        return jsonify(mapped + [m for m in MOCK_PRODUCTS if not any(d["name"].lower()==m["name"].lower() for d in mapped)])
    except Exception as e:
        return jsonify(MOCK_PRODUCTS)


@app.route("/api/stats")
def api_stats():
    try:
        farmers = sb.table("user_roles").select("*", count="exact").eq("role","farmer").execute()
        orders  = sb.table("orders").select("*", count="exact").execute()
        customers = sb.table("user_roles").select("*", count="exact").eq("role","consumer").execute()
        return jsonify({
            "farmers": farmers.count or 0,
            "orders":  orders.count  or 0,
            "customers": customers.count or 0,
            "cities": 1,
        })
    except:
        return jsonify({"farmers":0,"orders":0,"customers":0,"cities":1})


@app.route("/api/blog")
def api_blog():
    try:
        res = sb.table("blog_posts").select("*").eq("published", True).order("created_at", desc=True).execute()
        db = res.data or []
        db_mapped = [{"id":p["id"],"title":p["title"],"excerpt":p.get("excerpt",""),
                      "image":p.get("image_url","📰"),"author":p.get("author_name","Admin"),
                      "authorRole":"Farm2Home Team","date":(p.get("created_at","")[:10] if p.get("created_at") else ""),
                      "readTime":5,"category":p.get("category","Farming Tips"),
                      "tags":p.get("tags",[]),"likes":p.get("likes",0)} for p in db]
        return jsonify(db_mapped + MOCK_BLOGS)
    except:
        return jsonify(MOCK_BLOGS)


@app.route("/api/reviews")
def api_reviews():
    try:
        res = sb.table("reviews").select("*").order("created_at", desc=True).execute()
        return jsonify(res.data or [])
    except:
        return jsonify([])


@app.route("/api/price-data")
def api_price_data():
    try:
        res = sb.table("products").select("*").limit(8).execute()
        db = res.data or []
        if not db:
            return jsonify([{"name":p["name"],"farmPrice":p["price"],"marketPrice":p["marketPrice"]} for p in MOCK_PRODUCTS[:8]])
        return jsonify([{"name":p["name"].replace("Fresh ","").replace("Organic ",""),
                         "farmPrice":float(p["price"]),
                         "marketPrice":round(float(p["price"])*1.4),
                         "unit":p.get("unit","kg")} for p in db])
    except:
        return jsonify([{"name":p["name"],"farmPrice":p["price"],"marketPrice":p["marketPrice"]} for p in MOCK_PRODUCTS[:8]])


@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json()
    try:
        res = sb.auth.sign_in_with_password({"email": data["email"], "password": data["password"]})
        user = res.user
        session["user_id"]    = user.id
        session["user_email"] = user.email
        session["user_name"]  = user.user_metadata.get("full_name", user.email.split("@")[0])
        # fetch role
        role_res = sb.table("user_roles").select("role").eq("user_id", user.id).maybe_single().execute()
        session["user_role"] = role_res.data["role"] if role_res.data else "consumer"
        return jsonify({"ok": True, "name": session["user_name"], "role": session["user_role"]})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@app.route("/api/signup", methods=["POST"])
def api_signup():
    data = request.get_json()
    try:
        res = sb.auth.sign_up({"email": data["email"], "password": data["password"],
                                "options": {"data": {"full_name": data.get("fullName",""), "role": data.get("role","consumer")}}})
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 400


@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/scraped-vegetables")
def api_scraped():
    try:
        res = sb.table("scraped_vegetables").select("*").order("scraped_at", desc=True).limit(50).execute()
        return jsonify(res.data or [])
    except:
        return jsonify([])

# ── Page Routes ────────────────────────────────────────────────────────────────

@app.route("/")
def index(): return render_template("index.html", page="home")

@app.route("/marketplace")
def marketplace(): return render_template("index.html", page="marketplace")

@app.route("/cart")
def cart(): return render_template("index.html", page="cart")

@app.route("/checkout")
def checkout(): return render_template("index.html", page="checkout")

@app.route("/orders")
def orders(): return render_template("index.html", page="orders")

@app.route("/price-transparency")
def price_transparency(): return render_template("index.html", page="prices")

@app.route("/blog")
def blog(): return render_template("index.html", page="blog")

@app.route("/reviews")
def reviews(): return render_template("index.html", page="reviews")

@app.route("/login")
def login(): return render_template("index.html", page="login")

@app.route("/farmer-dashboard")
def farmer_dashboard(): return render_template("index.html", page="farmer")

@app.route("/admin")
def admin(): return render_template("index.html", page="admin")

# ── Helpers ────────────────────────────────────────────────────────────────────

EMOJI_MAP = {"tomato":"🍅","potato":"🥔","onion":"🧅","carrot":"🥕","brinjal":"🍆",
             "rice":"🌾","wheat":"🌾","maize":"🌽","chilli":"🌶️","spinach":"🥬",
             "mango":"🥭","banana":"🍌","turmeric":"🫚","coriander":"🌿","honey":"🍯"}

def _emoji(name):
    l = name.lower()
    for k, v in EMOJI_MAP.items():
        if k in l: return v
    return "🌱"


if __name__ == "__main__":
    print("FARM2HOME Flask server starting on http://localhost:5000")
    app.run(debug=True, port=5000)
