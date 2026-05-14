# AllInOne - Super-App Personal

AllInOne es un dashboard personal inteligente diseñado bajo una arquitectura de Agentes de Inteligencia Artificial. El sistema cruza datos en tiempo real para optimizar la gestión del patrimonio, la recuperación física y la planificación del tiempo.

El proyecto está concebido como un Monorepo con una aplicación web *mobile-first* que será empaquetada como aplicación nativa (APK) utilizando Capacitor.

---

## 🏗️ Arquitectura General

El sistema sigue los principios de **Clean Architecture** y está separado estrictamente en dos bloques principales dentro del mismo repositorio:

1.  **Frontend (UI y Lógica de Presentación)**
2.  **Backend (Lógica de Negocio y Orquestación IA)**

Se aplica el principio de Responsabilidad Única (SRP). Las llamadas a APIs externas (Gemini, proveedores financieros) están prohibidas en el cliente; todo flujo sensible transita a través de Firebase Cloud Functions.

---

## 🛠️ Stack Tecnológico

### Frontend
*   **Core:** React + Vite + TypeScript.
*   **Estilos:** Tailwind CSS (Dark Mode nativo).
*   **Patrón:** MVC (Modelo-Vista-Controlador) adaptado a componentes funcionales.
*   **Mobile:** Capacitor (futura integración para acceso a hardware y Health Connect).

### Backend (Firebase)
*   **Base de Datos:** Firestore (Sincronización en tiempo real vía *listeners*).
*   **Cómputo:** Cloud Functions (Node.js) para encapsular la lógica de IA y seguridad.
*   **Autenticación:** Firebase Auth.

### Inteligencia Artificial & APIs
*   **Motor:** Gemini 1.5 (Flash/Pro) vía API.
*   **Herramientas:** Function Calling (Google Search Grounding).
*   **Integraciones:** Google Calendar API, Health Connect (local DB).

---

## 🧠 Ecosistema de Agentes IA

El núcleo de la aplicación reside en tres agentes independientes que se comunican de forma asíncrona a través de eventos en Firestore:

### 1. Agente Financiero
*   **Perfil:** Analítico y objetivo.
*   **Responsabilidad:** Leer el árbol de datos de inversiones (ETFs, liquidez, criptoactivos), evaluar el riesgo del portfolio y utilizar *Function Calling* para buscar en internet noticias macroeconómicas o el rendimiento de activos específicos. 
*   **Flujo:** Escribe recomendaciones y alertas de rebalanceo en Firestore.

### 2. Agente de Salud
*   **Perfil:** Empático y científico.
*   **Responsabilidad:** Procesar métricas biométricas extraídas de Health Connect (pasos diarios, calidad del sueño, variabilidad de la frecuencia cardíaca y recuperación post-entrenamiento en el gimnasio).
*   **Flujo:** Traduce los datos crudos a un nivel de "Batería Corporal" y emite alertas de fatiga o picos de rendimiento.

### 3. Agente de Calendario (Orquestador Global)
*   **Perfil:** Eficiente y resolutivo.
*   **Responsabilidad:** Actúa como el director de orquesta del sistema. Lee los flujos de los otros agentes y la API de Google Calendar.
*   **Flujo:** Si el Agente de Salud detecta mala recuperación tras una sesión intensa, el Orquestador evalúa los bloques de estudio de ingeniería, las clases en la universidad y el horario laboral para sugerir y/o bloquear automáticamente ventanas de descanso activo en el calendario.

---

## 📂 Estructura del Repositorio

```text
/
├── shared/                 # Modelos de dominio y tipos de TS (Ej: IPortfolio, IRecovery)
│
├── frontend/               # Aplicación React/Vite
│   ├── src/
│   │   ├── presentation/   # Vistas, Componentes UI y Hooks de presentación. (Sin lógica de negocio).
│   │   ├── domain/         # Entidades, abstracciones y casos de uso.
│   │   └── infrastructure/ # Conexión con Firebase, Listeners de Firestore, llamadas a Cloud Functions.
│   └── capacitor.config.ts # Configuración para la futura compilación del APK.
│
└── firebase-backend/       # Entorno Node.js
    ├── functions/
    │   ├── src/
    │   │   ├── agents/     # Lógica de los Agentes Financiero, Salud y Calendario.
    │   │   ├── api/        # Endpoints (httpsCallable) que consume el frontend.
    │   │   └── services/   # Clientes para Gemini API y Google Calendar API.
    ├── firestore.rules     # Reglas de seguridad estrictas de la base de datos.
    └── firestore.indexes   # Índices para consultas compuestas.
