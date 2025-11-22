<div align="center">
  <img src="public/logo.png" alt="ResuAI Logo" width="200" style="margin-bottom: 20px;" />

  <h1 style="font-size: 3rem; margin: 0;"><b>ResuAI</b></h1>

  <p style="font-size: 1.25rem; color: #888;">
    Create Stunning Resumes & Portfolios with the Power of AI
  </p>

  <p>
    <a href="https://resuu-ai.vercel.app/" target="_blank">
      <img src="https://img.shields.io/badge/Live%20Demo-Visit%20Now-brightgreen?style=for-the-badge&logo=vercel" alt="Live Demo" />
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/github/stars/MrTG1B/ResuAI?style=social" alt="GitHub Stars" />
    <img src="https://img.shields.io/github/forks/MrTG1B/ResuAI?style=social" alt="GitHub Forks" />
    <img src="https://img.shields.io/github/license/MrTG1B/ResuAI?style=flat-square&logo=github&label=license" alt="License" />
  </p>
</div>

---

## ✨ Introduction

**ResuAI** is an intelligent, modern platform designed to revolutionize your job application process. By leveraging the power of Generative AI, ResuAI helps you effortlessly create, refine, and showcase your professional story. Whether you're building a resume from scratch, optimizing it for Applicant Tracking Systems (ATS), or generating a stunning portfolio website, ResuAI is your personal career-building assistant.

<br />

<div align="center">
<a href="https://resuu-ai.vercel.app">
<img src="https://image.thum.io/get/width/1200/crop/630/https://resuu-ai.vercel.app/" alt="ResuAI Live Preview" width="100%" style="border-radius: 10px;" />
</a>
<br />
<br />
<a href="https://resuu-ai.vercel.app"><b>🚀 Click here to try ResuAI Live</b></a>
</div>

## 🚀 Key Features

Our suite of AI-powered tools is designed to give you a competitive edge in the job market.

<table>
  <tr>
    <td width="50%" valign="top">
      <h4>📄 AI Resume Editor</h4>
      <p>Refine content, improve phrasing, and redesign layouts with ATS-friendly templates, all guided by AI.</p>
    </td>
    <td width="50%" valign="top">
      <h4>🔍 AI Resume Analyzer</h4>
      <p>Get instant, data-driven feedback on your resume against any job description for optimal ATS performance.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h4>🌐 AI Portfolio Generator</h4>
      <p>Transform your resume into a beautiful, responsive portfolio website in seconds with unique, shareable links.</p>
    </td>
    <td width="50%" valign="top">
      <h4>✍️ AI Cover Letter Writer</h4>
      <p>Generate personalized and professional cover letters tailored to any job, based on your unique profile data.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h4>🧠 AI Interview & Aptitude Tests</h4>
      <p>Practice for interviews with a mock AI coach and sharpen your skills with timed aptitude tests.</p>
    </td>
    <td width="50%" valign="top">
      <h4>👤 Centralized Professional Profile</h4>
      <p>Maintain a single source of truth for your career information, ensuring consistency across all AI tools.</p>
    </td>
  </tr>
</table>

## 🛠️ Tech Stack

ResuAI is built with a modern, scalable, and efficient technology stack:

| Category          | Technology                                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Framework**     | ![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)                                                                       |
| **Styling**       | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) & ![ShadCN UI](https://img.shields.io/badge/ShadCN_UI-black?style=for-the-badge&logo=shadcn-ui&logoColor=white)                                    |
| **AI & Gen UI**   | ![Genkit](https://img.shields.io/badge/Genkit-blue?style=for-the-badge&logo=google-cloud&logoColor=white)                                           |
| **Authentication**| ![Firebase Auth](https://img.shields.io/badge/Firebase-Auth-orange?style=for-the-badge&logo=firebase&logoColor=white)                                                  |
| **Database**      | ![Firestore](https://img.shields.io/badge/Firestore-blue?style=for-the-badge&logo=firebase&logoColor=white)                                                     |
| **Hosting**       | ![Vercel](https://img.shields.io/badge/Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)                                                                                     |
| **PDF Generation**| ![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)                                                      |


## 🏁 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/MrTG1B/ResuAI.git
    cd ResuAI
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up your environment variables:**
    Create a `.env` file in the root of your project and add your Firebase and API keys. You can get these from your Firebase project settings and the Google AI Studio.
    ```env
    # Firebase Client SDK Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY=
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
    NEXT_PUBLIC_FIREBASE_APP_ID=

    # AI Configuration - Choose one:
    
    # Option 1: Google AI (Gemini) API Key (for development)
    NEXT_PUBLIC_GEMINI_API_KEY=
    
    # Option 2: Vertex AI Cloud Agent (for production)
    # Requires GCP project setup and Application Default Credentials
    # GCLOUD_PROJECT=your-gcp-project-id
    # GCLOUD_LOCATION=us-central1

    # ImageBB API Key (for image uploads)
    NEXT_PUBLIC_IMGBB_API_KEY=
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤖 AI Configuration

ResuAI supports two AI backend options:

### Google AI (Development)
Uses Google AI API with an API key. Best for development and testing.
- Set `NEXT_PUBLIC_GEMINI_API_KEY` environment variable
- Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Vertex AI Cloud Agent (Production)
Uses Google Cloud Vertex AI with Application Default Credentials. Recommended for production deployments.
- Set `GCLOUD_PROJECT` to your GCP project ID
- Optionally set `GCLOUD_LOCATION` (defaults to `us-central1`)
- Requires [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials)
- Better enterprise SLAs, quotas, and security

Both options can be configured simultaneously for gradual migration.

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📬 Contact

Tirthankar Dasgupta - [@TirthankarDasg7](https://twitter.com/TirthankarDasg7)

Project Link: [https://github.com/MrTG1B/ResuAI](https://github.com/MrTG1B/ResuAI)