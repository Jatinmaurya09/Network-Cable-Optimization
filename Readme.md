# 🌐 Network Cable Optimization using Minimum Spanning Tree

> Interactive visualizer for minimizing network cable cost using **Prim's** and **Kruskal's** algorithms — a Design & Analysis of Algorithms (DAA) college project.

![Status](https://img.shields.io/badge/status-complete-brightgreen)
![Made with](https://img.shields.io/badge/made%20with-HTML%20%7C%20CSS%20%7C%20JS-blue)
![License](https://img.shields.io/badge/license-MIT-green)

🔗 **Live Demo:** [network-cable-optimization.vercel.app](https://network-cable-optimization.vercel.app)

---

## 📖 Problem Statement

A college campus has **N buildings** (labs, hostels, admin blocks) that must all be connected to a single network. Laying a cable between any two buildings has a **cost** (distance, material, trenching). The goal is to connect **every** building with the **minimum total cable length**.

This maps directly to the **Minimum Spanning Tree (MST)** problem:

- **Vertices (V)** = buildings
- **Edges (E)** = possible cable routes  
- **Weight** = cost of laying cable

The optimal solution uses exactly **V − 1** edges with no cycles.

---

## ✨ Features

- 🎨 **Interactive Canvas** — drag, add, delete nodes and cables
- 🏛 **3 Preset Topologies** — College Campus, Small Office, Hostel Block
- 🎲 **Random Graph Generator**
- ▶ **Animated Execution** of Prim's & Kruskal's algorithms
- ⏯ **Play / Pause / Step** controls with adjustable speed
- 📊 **Real-time Stats** — total cost, cables used, step-by-step log
- 📘 **Theory Tab** — MST definitions, cut/cycle properties
- 💻 **Code Tab** — C++ implementations of both algorithms
- 📈 **Comparison Tab** — Prim's vs Kruskal's detailed analysis

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Structure | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox) |
| Logic | Vanilla JavaScript (ES6+) |
| Rendering | HTML5 Canvas API |
| Hosting | Vercel |

No frameworks, no build step — pure vanilla web.

---

## 📂 Project Structure
