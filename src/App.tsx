import { useState } from "react";
import type { MerchTemplate, UserImage } from "./types";
import { TemplateSelector } from "./components/TemplateSelector";
import { EditorWrapper } from "./components/EditorWrapper";

// Данные шаблонов с реальными фотографиями футболки
const templates: MerchTemplate[] = [
  {
    id: "tshirt-front",
    name: "Футболка (перед)",
    imageUrl: "/front.jpeg",
    canvasWidth: 400,
    canvasHeight: 550,
    printableArea: {
      x: 120,
      y: 140,
      width: 160,
      height: 200,
    },
  },
  {
    id: "tshirt-back",
    name: "Футболка (спина)",
    imageUrl: "/back.jpeg",
    canvasWidth: 400,
    canvasHeight: 550,
    printableArea: {
      x: 120,
      y: 140,
      width: 160,
      height: 200,
    },
  },
];

function App() {
  const [currentTemplate, setCurrentTemplate] = useState<MerchTemplate | null>(
    null
  );
  const [userImage, setUserImage] = useState<UserImage | null>(null);

  const handleTemplateSelect = (template: MerchTemplate) => {
    setCurrentTemplate(template);
  };

  const handleBackToSelector = () => {
    setCurrentTemplate(null);
    setUserImage(null);
  };

  const switchTemplate = (templateId: string) => {
    const newTemplate = templates.find(t => t.id === templateId);
    if (newTemplate) {
      setCurrentTemplate(newTemplate);
    }
  };

  return (
    <div className="App">
      {!currentTemplate ? (
        <TemplateSelector
          templates={templates}
          onTemplateSelect={handleTemplateSelect}
        />
      ) : (
        <EditorWrapper
          template={currentTemplate}
          onBack={handleBackToSelector}
          userImage={userImage}
          setUserImage={setUserImage}
          onSwitchTemplate={switchTemplate}
        />
      )}
    </div>
  );
}

export default App;
