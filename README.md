# LegalynX  
### **Conversational AI-Powered Platform for Paralegal Document Intelligence**  
**RAG • Multi-Granularity Chunking • Document Storage • AI Assistant**

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.10+-yellow?logo=python)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--powered-412991?logo=openai)
![Railway](https://img.shields.io/badge/Backend-Railway-purple?logo=railway)
![Status](https://img.shields.io/badge/Status-Active-success)

---

# 📘 Overview

**LEGALYNX** is a conversational AI platform tailored for **paralegals and legal assistants**, combining:

- **RAG (Retrieval-Augmented Generation)**  
- **Multi-granularity chunking**  
- **Google-Drive-like document storage**  
- **Legal document classification & validation**  
- **Conversational interface for querying legal documents**  

Designed for speed, accuracy, and modern deployment (Railway, Vercel, AWS).

---

# 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (React Server Components) |
| **Backend API** | FastAPI (Python) |
| **RAG Engine** | Python, LangChain, OpenAI |
| **Storage** | AWS S3 |
| **Authentication** | JWT, bcrypt |
| **Email + Billing** | SendGrid, PayPal Subscriptions |
| **Deployment** | Railway + Vercel |

---

# 📦 Installation

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-org/legalynx.git
cd legalynx
````

## 2️⃣ Install Dependencies

### Frontend:

```bash
npm install
```

### Backend:

```bash
pip install -r requirements.txt
```

---

# ▶️ Running the App (Local Development)

### Start Frontend

```bash
npm run dev
```

### Start Backend

```bash
npm run fastapi
```

### Access the App

| Service      | URL                                                      |
| ------------ | -------------------------------------------------------- |
| Frontend     | [http://localhost:3000](http://localhost:3000)           |
| FastAPI Docs | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) |

---

# 🔐 Environment Variables (`.env`)
Setup your `.env` variable
```bash
# Database
DATABASE_URL=postgresql-url

# Email + Billing
SENDGRID_API_KEY=SG.YOURSENDGRIDAPIKEY
SENDGRID_FROM_EMAIL=youremail@email.com

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000/
JWT_SECRET=YOURJWTSECRET

# LLM
OPENAI_API_KEY=sk-proj-youropenaiaccesskey

# PayPal Billing
PAYPAL_CLIENT_ID=CLIENTID
PAYPAL_CLIENT_SECRET=PAYPALSECRET
PAYPAL_ENV=sandbox
PAYPAL_STANDARD_MONTHLY_PLAN_ID=P-XXXX
PAYPAL_PREMIUM_MONTHLY_PLAN_ID=P-YYYY

# Backend (FastAPI)
FAST_API_URL=https://your-fastapi.railway.app

# AWS S3
AWS_ACCESS_KEY_ID=XXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXX
AWS_REGION=ap-southeast-2
AWS_S3_BUCKET_NAME=bucket-name
AWS_S3_BUCKET_URL=https://bucket-name.s3.ap-southeast-2.amazonaws.com/

# Company (for invoices)
COMPANY_NAME=LegalynX
COMPANY_ADDRESS=123 Mahusay Street, Manila
COMPANY_EMAIL=billing@legalynx.com
COMPANY_PHONE=+63 (950) 413-4567
COMPANY_WEBSITE=https://legalynx.vercel.app
```

---

# 🧠 Architecture Overview

```
                ┌──────────────────────┐
                │      Frontend        │
                │     Next.js 14       │
                └─────────┬────────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │       FastAPI        │
               │ (Auth, API, Routing) │
               └─────────┬────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │              RAG Engine             │
        │ Multi-granularity chunking, LLM,    │
        │ Embeddings, Document Validation     │
        └────────────────────┬────────────────┘
                             │
                             ▼
                ┌──────────────────────┐
                │        AWS S3         │
                │  Document Storage     │
                └──────────────────────┘
```

---

# 🚀 Deploy to Railway (Backend)

## 1️⃣ Create a Railway Project

Go to: [https://railway.app](https://railway.app)

## 2️⃣ Deploy FastAPI

You can deploy automatically:

**Deploy Button:**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?templateUrl=https://github.com/your-org/legalynx)

Or manually:

```bash
railway init
railway up
```

## 3️⃣ Add Environment Variables

Railway/backend specific `.env` environment variables

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000/
JWT_SECRET=YOURJWTSECRET
OPENAI_API_KEY=sk-proj-youropenaiaccesskey
```


## 4️⃣ Get your Backend URL

Example:

```
https://legalynx-production.up.railway.app
```

Update this in your `.env`:

```
FAST_API_URL=https://legalynx-production.up.railway.app
```

---

# 🚀 Deploy Frontend (Vercel)

1. Go to [https://vercel.com](https://vercel.com)
2. Import the GitHub repo
3. Add environment variables
4. Deploy 🎉

---

# 🧪 Testing the RAG Pipeline

Upload documents → system classifies legal vs non-legal → text is extracted once → chunked by multiple granularities → embedded → ready for semantic search and answering.

---

# 🛠️ Troubleshooting

| Issue           | Fix                                                        |
| --------------- | ---------------------------------------------------------- |
| API returns 500 | Check your Railway logs & missing env vars                 |
| Upload fails    | Confirm AWS permissions + region                           |
| RAG slow        | Ensure embeddings are not regenerating; caching is enabled |
| CORS issues     | Update FastAPI CORS settings                               |

---

# 🤝 Contributing

We welcome and appreciate all contributions—whether you're reporting bugs, suggesting features, or improving code.

### Submitting Code (Pull Requests)

Feel free to open PRs for bug fixes or small enhancements.

Follow the project’s coding style and include a clear description of the change and its purpose.

### Major Changes

For large features or architectural updates, please open an issue first.
This lets us discuss the proposal, ensure alignment with project goals, and avoid duplicated or unnecessary work.

Thank you for contributing and helping improve the project!

---

# 📄 License

MIT License

---

## ⭐ If you like this project, give it a star!
