# CarCheckUp 360° 🚗🔍

**CarCheckUp 360°** is an AI-powered vehicle damage assessment and repair estimation platform. It leverages advanced Computer Vision (YOLOv8, EfficientNet) and Machine Learning (XGBoost) models to analyze uploaded images of vehicle damage, predict severity, and calculate an estimated repair cost. 

The application features a premium, responsive **Next.js** frontend with a fully interactive **3D holographic vehicle viewer**, and a lightning-fast **FastAPI** backend to process machine learning pipelines in real-time.

---

## ✨ Key Features

- **3D Interactive Vehicle Dashboard**: A futuristic, interactive 3D model of a sedan that maps damage to specific vehicle parts (doors, bumpers, panels) using Raycasting and Three.js.
- **Object Detection (YOLOv8)**: Detects the bounding boxes of damaged areas on the vehicle with high accuracy.
- **Damage Severity Classification (EfficientNet/ResNet)**: Classifies the severity of the damage (Minor, Moderate, Severe) to determine the complexity of the repair.
- **AI Repair Cost Estimation (XGBoost)**: A sophisticated regression model (Cost Model v3) that evaluates the parts detected and their severity to predict real-world repair costs.
- **Premium Dark-Mode UI**: Built with TailwindCSS and React, featuring frosted glass effects, glowing gradients, and animated components.
- **Scalable Architecture**: Docker-ready setup designed to easily deploy on cloud platforms with heavy ML workloads (e.g., Hugging Face Spaces).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **3D Rendering**: Three.js / React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python)
- **Computer Vision**: OpenCV (`opencv-python-headless`), Ultralytics YOLOv8
- **Deep Learning**: TensorFlow / Keras (EfficientNet)
- **Machine Learning**: Scikit-Learn, XGBoost
- **Server**: Uvicorn

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/PraveenChigurla/CarCheckUp-360.git
cd CarCheckUp-360
```

### 2. Setup the Backend (FastAPI + ML Models)
The backend requires the ML models (`yolo_best.pt`, `severity_efficientnet_v4.keras`, `repair_cost_xgboost_v3.joblib`) to be present in the `models/` directory at the root of the project.

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API will now be running at `http://localhost:8000`.

### 3. Setup the Frontend (Next.js)
Open a new terminal window and run:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend application will now be running at `http://localhost:3000`.

---

## ☁️ Deployment

This project includes Dockerfiles specifically configured for hosting the ML models on **Hugging Face Spaces** (which provides 16GB of free RAM, required for loading PyTorch + TensorFlow simultaneously).

### Deploying to Hugging Face Spaces (Docker)
1. **Backend**: 
   - Create a new Blank Docker Space on Hugging Face.
   - Upload the repository.
   - Rename `Dockerfile.backend` to `Dockerfile`.
   - Your API will be live on port 7860.
2. **Frontend**:
   - Create a second Blank Docker Space.
   - Upload the repository.
   - Rename `Dockerfile.frontend` to `Dockerfile`.
   - Add a Secret/Variable in the Space settings: `NEXT_PUBLIC_API_URL = <your-backend-space-url>`.

Alternatively, the frontend can be deployed easily on **Vercel** by importing the GitHub repository and setting the Root Directory to `frontend`.

---

## 📁 Project Structure

```text
├── backend/
│   ├── app/                # FastAPI application code (main.py, routers, schemas)
│   ├── services/           # ML services (YOLO, Severity, XGBoost pipeline)
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/app/            # Next.js pages and routing
│   ├── src/components/     # React UI components & 3D Viewer (Vehicle3D.tsx)
│   ├── package.json        # Node.js dependencies
│   └── tailwind.config.ts  # Tailwind configuration
├── models/                 # Heavy ML model files (.pt, .keras, .joblib)
├── Dockerfile.backend      # Dockerfile for deploying the FastAPI service
├── Dockerfile.frontend     # Dockerfile for deploying the Next.js frontend
└── README.md
```
