# CarCheckUp 360° 🚗🔍

**CarCheckUp 360°** is an AI-powered vehicle damage assessment and repair estimation platform. It leverages advanced Computer Vision (YOLOv8, EfficientNet) and Machine Learning (XGBoost) models to analyze uploaded images of vehicle damage, predict severity, and calculate an estimated repair cost. 

The application features a premium, responsive **Next.js** frontend with a fully interactive **3D holographic vehicle viewer**, and a lightning-fast **FastAPI** backend to process machine learning pipelines in real-time.

---

## 🌐 Live Demo

The application is deployed live on Render's Free Tier!

- **Frontend (UI)**: [https://carcheckup-360.onrender.com](https://carcheckup-360.onrender.com)
- **Backend (API)**: [https://carcheckup-backend.onrender.com](https://carcheckup-backend.onrender.com)

*(Note: Since this is hosted on a free tier, the backend may take 30-50 seconds to spin up from sleep if it hasn't been used recently.)*

---

## ✨ Key Features

- **3D Interactive Vehicle Dashboard**: A futuristic, interactive 3D model of a sedan that maps damage to specific vehicle parts (doors, bumpers, panels) using Raycasting and Three.js.
- **Object Detection (YOLOv8 via ONNX)**: Detects the bounding boxes of damaged areas on the vehicle with high accuracy.
- **Damage Severity Classification (EfficientNet via TFLite)**: Classifies the severity of the damage (Minor, Moderate, Severe) to determine the complexity of the repair.
- **AI Repair Cost Estimation (XGBoost)**: A sophisticated regression model (Cost Model v3) that evaluates the parts detected and their severity to predict real-world repair costs.
- **Premium Dark-Mode UI**: Built with TailwindCSS and React, featuring frosted glass effects, glowing gradients, and animated components.
- **Ultra-Lightweight Inference**: ML pipelines were completely decoupled from heavy frameworks like PyTorch and Keras. Inference runs exclusively on C++ CPU Delegates (`onnxruntime`, `tensorflow-cpu`), bringing runtime memory footprint down from 1.5GB+ to ~150MB.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **3D Rendering**: Three.js / React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python)
- **Computer Vision**: OpenCV (`opencv-python-headless`)
- **Deep Learning Inference**: ONNX Runtime (`onnxruntime`), TFLite Runtime / TensorFlow CPU
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
The backend requires the optimized ML models (`yolo_best.onnx`, `severity_efficientnet_v4.tflite`, `repair_cost_xgboost_v3.joblib`) to be present in the `models/` directory at the root of the project.

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

## ☁️ Deployment (Render)

This project has been heavily optimized to deploy seamlessly on the **Render Free Tier (512MB RAM)**.

We use an Infrastructure-as-Code `render.yaml` blueprint located at the root of the project to automatically configure both the frontend (Node.js) and backend (Python 3.10) environments.

To deploy your own instance:
1. Connect your GitHub repository to Render.
2. Go to **Blueprints** -> **New Blueprint Instance**.
3. Select this repository. Render will automatically detect the `render.yaml` file and spin up both Web Services simultaneously.
4. The environment variables (such as `NEXT_PUBLIC_API_URL` linking the frontend to the backend) are handled automatically by the blueprint!

---

## 📁 Project Structure

```text
├── backend/
│   ├── app/                # FastAPI application code (main.py, routers, schemas)
│   ├── services/           # ML services (ONNX, TFLite, XGBoost pipelines)
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/app/            # Next.js pages and routing
│   ├── src/components/     # React UI components & 3D Viewer (Vehicle3D.tsx)
│   ├── package.json        # Node.js dependencies
│   └── tailwind.config.ts  # Tailwind configuration
├── models/                 # Lightweight Inference Models (.onnx, .tflite, .joblib)
├── render.yaml             # Render Infrastructure Deployment Blueprint
└── README.md
```
