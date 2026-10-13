# 🌐 Network Cable Optimization using Minimum Spanning Tree

> Interactive visualizer for minimizing network cable cost using **Prim's** and **Kruskal's** algorithms — a Design & Analysis of Algorithms (DAA) college project.

![Status](https://img.shields.io/badge/status-complete-brightgreen)
![Made with](https://img.shields.io/badge/made%20with-HTML%20%7C%20CSS%20%7C%20JS-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

🔗 **Live Demo:** [network-cable-optimization.vercel.app](https://network-cable-optimization.vercel.app)

---

## 📖 Problem Statement

A college campus has **N buildings** (labs, hostels, admin blocks) that must all be connected to a single network. Laying a cable between any two buildings has a **cost** (distance, material, trenching). The goal is to connect **every** building with the **minimum total cable length**.

This maps directly to the **Minimum Spanning Tree (MST)** problem in graph theory:

- **Vertices (V)** = buildings
- **Edges (E)** = possible cable routes
- **Weight** = cost of laying that cable

The optimal solution uses exactly **V − 1** edges with no cycles.

---

## ✨ Features

- 🎨 **Interactive Canvas** — drag, add, delete nodes and cables manually
- 🏛 **3 Preset Topologies** — College Campus, Small Office, Hostel Block
- 🎲 **Random Graph Generator** — quick test networks
- ▶️ **Animated Execution** of both Prim's & Kruskal's algorithms
- ⏯️ **Play / Pause / Step** controls with adjustable animation speed
- 📊 **Real-time Stats** — total cable cost, cables used, step-by-step log
- 📘 **Theory Tab** — MST definitions, cut/cycle properties, applications
- 💻 **Code Tab** — C++ implementations of both algorithms
- 📈 **Comparison Tab** — Prim's vs Kruskal's detailed analysis
- 📱 **Responsive** — works on desktop, tablet, and mobile

---

## 🚀 Live Demo

🔗 **[View Live on Vercel](https://network-cable-optimization.vercel.app)**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Structure | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox) |
| Logic | Vanilla JavaScript (ES6+) |
| Rendering | HTML5 Canvas API |
| Hosting | Vercel |

**No frameworks, no build step — pure vanilla web.**

---

## 📂 Project Structure

```
Network-Cable-Optimization/
├── index.html      # Main page — layout & content
├── style.css       # All styling & responsive design
├── script.js       # Graph logic + algorithm animations
├── README.md       # This file
└── LICENSE         # MIT License
```

---

## 🧠 Algorithms Implemented

### Prim's Algorithm

- **Strategy:** Grow a single tree from a start vertex
- **Data Structure:** Min-heap / priority queue
- **Time Complexity:** O(E log V) with binary heap
- **Best For:** Dense graphs

### Kruskal's Algorithm

- **Strategy:** Sort edges, greedily add if no cycle forms
- **Data Structure:** Union-Find (Disjoint Set Union)
- **Time Complexity:** O(E log E)
- **Best For:** Sparse graphs

Both produce the **same minimum total cost** when all edge weights are distinct.

---

## 📊 Complexity Comparison

| Aspect | Prim's | Kruskal's |
|--------|--------|-----------|
| Strategy | Vertex-based | Edge-based |
| Data Structure | Min-heap | Union-Find |
| Time Complexity | O(E log V) | O(E log E) |
| Best For | Dense graphs | Sparse graphs |
| Start Vertex | Required | Not required |
| Disconnected Graph | MST of one component | Minimum spanning forest |

---

## 🏃 How to Run Locally

1. Clone the repository:

```bash
git clone https://github.com/Jatinmaurya09/Network-Cable-Optimization.git
cd Network-Cable-Optimization
```

2. Open `index.html` in any modern browser.

That's it — no `npm install`, no server needed. ✅

---

## ☁️ Deploy on Vercel

### Via GitHub (Recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import this repo → Click **Deploy**
4. Done! Auto-redeploys on every push.

### Via Vercel CLI

```bash
npm install -g vercel
vercel
```

---

## 🎓 Academic Context

This project was developed as part of the **Design and Analysis of Algorithms (DAA)** course to demonstrate:

- Practical application of greedy algorithms
- Graph theory in real-world network design
- Comparative analysis of MST algorithms
- Interactive algorithm visualization

---

## 📋 Real-World Applications

- 📡 LAN / campus network cabling
- ⚡ Electrical power grid layout
- 💧 Water & gas pipeline networks
- 🛣️ Road / railway construction
- 🧬 Clustering in machine learning
- 🖼️ Image segmentation
- 🔌 Circuit board wiring
- 🌐 Spanning Tree Protocol (STP) in Ethernet switches

---

## 🖼️ Screenshots

> _Add screenshots of your visualizer here — Visualizer tab, running Prim's, running Kruskal's, comparison table_

### Visualizer Tab
![Visualizer](https://via.placeholder.com/800x400?text=Interactive+Visualizer)

### Running Prim's Algorithm
![Prim's](https://via.placeholder.com/800x400?text=Prim's+Algorithm+Animation)

### Running Kruskal's Algorithm
![Kruskal's](https://via.placeholder.com/800x400?text=Kruskal's+Algorithm+Animation)

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**Jatin Maurya**

- GitHub: [@Jatinmaurya09](https://github.com/Jatinmaurya09)

---

## 📜 License

This project is licensed under the **MIT License** — free to use for educational purposes.

See the [LICENSE](LICENSE) file for details.

---

## ⭐ Show Your Support

If this project helped you with your DAA project or learning, give it a ⭐ on GitHub!

---

<p align="center">Made with ❤️ by <a href="https://github.com/Jatinmaurya09">Jatin Maurya</a></p>
