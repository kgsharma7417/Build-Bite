import { useState } from "react";
import { AppProvider } from "./context/AppContext";
import Home from "./pages/Home";
import TopicView from "./pages/TopicView";
import QuestionView from "./pages/QuestionView";
import PracticeMode from "./pages/PracticeMode";
import PDFViewer from "./pages/PDFViewer";
import AddQuestion from "./pages/AddQuestion";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [params, setParams] = useState({});

  const navigate = (to, p = {}) => {
    setScreen(to);
    setParams(p);
  };

  const screens = {
    home: <Home navigate={navigate} />,
    topic: <TopicView navigate={navigate} params={params} />,
    question: <QuestionView navigate={navigate} params={params} />,
    practice: <PracticeMode navigate={navigate} params={params} />,
    pdf: <PDFViewer navigate={navigate} params={params} />,
    addQuestion: <AddQuestion navigate={navigate} params={params} />,
  };

  return (
    <AppProvider>
      <div className="app">{screens[screen]}</div>
    </AppProvider>
  );
}
