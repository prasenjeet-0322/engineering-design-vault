# 💾 23 - Specialized Storage & GIS (C110-C115)

## 🧭 Proximity, Search & Vector Storage Study Path
*   [C110 - Geohashing and Proximity Search](./01-Geohashing-and-Proximity-Search.md)
*   [C111 - Full-Text Search Lucene Internals](./02-Full-Text-Search-Lucene-Internals.md)
*   [C112 - Vector Databases and ANN](./03-Vector-Databases-and-ANN.md)
*   [C113 - Time-Series Databases](./04-Time-Series-Databases.md)
*   [C115 - Elasticsearch Architecture & System Design Deep Dive](./05-Elasticsearch-Architecture-and-System-Design-Deep-Dive.md)

---

## 📖 The Concept
Standard relational and document databases are optimized for scalar queries (e.g., retrieving by ID or simple column matching). However, modern system designs require specialized engines to handle complex queries at massive scale:
1. **Spatial Proximity**: Locating points near a latitude/longitude coordinate (Uber, Yelp).
2. **Full-Text Inverted Search**: Compacting and searching text with relevance scoring (Elasticsearch).
3. **Vector / Semantic Search**: Finding nearest neighbors in high-dimensional embedding spaces for AI/RAG.
4. **Time-Series Metric Ingestion**: Storing massive write-heavy logs compressed over time (Prometheus).
