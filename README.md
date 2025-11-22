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
  <a href="https://resuu-ai.vercel.app/" target="_blank">
    <img src="https://i.ibb.co/L84mPjP/project-preview.png" alt="ResuAI Application Preview" style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); border: 1px solid #333;" />
  </a>
</div>

## 🚀 Key Features

Our suite of AI-powered tools is designed to give you a competitive edge in the job market:

- **📄 AI Resume Editor**: Upload an existing resume or start from scratch. Our AI assistant helps you refine content, improve phrasing, and even redesign the entire layout with professional, ATS-friendly templates.
- **🔍 AI Resume Analyzer**: Get instant, data-driven feedback. Our "AI Coach" analyzes your resume against any job description, scores its ATS-friendliness, and provides actionable steps to optimize it for success.
- **🌐 AI Portfolio Generator**: Transform your resume into a beautiful, responsive portfolio website in seconds. Choose from multiple themes and generate a unique, shareable link to impress recruiters.
- **✍️ AI Cover Letter Writer**: Generate personalized and professional cover letters tailored to any job description. Select a tone and let the AI craft a compelling letter based on your profile data.
- **🧠 AI Interview Practice & Aptitude Tests**: Prepare for interviews with a mock session against an AI coach. Sharpen your skills with timed aptitude tests covering logical, quantitative, and verbal reasoning.
- **👤 Centralized Professional Profile**: Maintain a single source of truth for your career information. Your profile data is used by all our AI tools to ensure consistency and accuracy.

## 🛠️ Tech Stack

ResuAI is built with a modern, scalable, and efficient technology stack:

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **AI & Generative UI**: [Google's Gemini Pro via Genkit](https://firebase.google.com/docs/genkit)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Database**: [Cloud Firestore](https://firebase.google.com/docs/firestore)
- **Hosting**: [Vercel](https://vercel.com/)
- **PDF Generation**: [Playwright](https://playwright.dev/) in a serverless function

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

    # Google AI (Gemini) API Key
    NEXT_PUBLIC_GEMINI_API_KEY=

    # ImageBB API Key (for image uploads)
    NEXT_PUBLIC_IMGBB_API_KEY=
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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