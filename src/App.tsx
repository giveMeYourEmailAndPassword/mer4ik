import { useState } from "react";
import type { MerchTemplate, UserImage } from "./types";
import { TemplateSelector } from "./components/TemplateSelector";
import { EditorWrapper } from "./components/EditorWrapper";

// Данные шаблонов с реальными фотографиями футболки и худи
const templates: MerchTemplate[] = [
  {
    id: "tshirt",
    name: "Футболка",
    imageUrl: "/front.jpeg",
    canvasWidth: 400,
    canvasHeight: 550,
    printableArea: {
      x: 100,
      y: 140,
      width: 200,
      height: 300,
    },
  },
  {
    id: "hoodie",
    name: "Худи",
    imageUrl: "/hodie2.jpg",
    canvasWidth: 400,
    canvasHeight: 480,
    printableArea: {
      x: 100,
      y: 120,
      width: 200,
      height: 280,
    },
  },
];

// Все доступные стороны футболки
const tshirtSides: Record<string, MerchTemplate> = {
  "tshirt-front": {
    id: "tshirt-front",
    name: "Футболка",
    imageUrl: "/front.jpeg",
    canvasWidth: 400,
    canvasHeight: 550,
    printableArea: {
      x: 100,
      y: 140,
      width: 200,
      height: 300,
    },
  },
  "tshirt-back": {
    id: "tshirt-back",
    name: "Футболка",
    imageUrl: "/back.jpeg",
    canvasWidth: 400,
    canvasHeight: 550,
    printableArea: {
      x: 100,
      y: 140,
      width: 200,
      height: 300,
    },
  },
};

// Все доступные стороны худи
const hoodieSides: Record<string, MerchTemplate> = {
  "hoodie-front": {
    id: "hoodie-front",
    name: "Худи",
    imageUrl: "/hodie2.jpg",
    canvasWidth: 400,
    canvasHeight: 480,
    printableArea: {
      x: 100,
      y: 120,
      width: 200,
      height: 260,
    },
  },
  "hoodie-back": {
    id: "hoodie-back",
    name: "Худи",
    imageUrl: "/hodie1.jpg",
    canvasWidth: 400,
    canvasHeight: 480,
    printableArea: {
      x: 100,
      y: 150,
      width: 200,
      height: 200,
    },
  },
};

function App() {
  const [currentTemplate, setCurrentTemplate] = useState<MerchTemplate | null>(
    null
  );
  const [userImage, setUserImage] = useState<UserImage | null>(null);

  const handleTemplateSelect = (template: MerchTemplate) => {
    // Если выбрана футболка, по умолчанию открываем переднюю сторону
    if (template.id === "tshirt") {
      setCurrentTemplate(tshirtSides["tshirt-front"]);
    } else if (template.id === "hoodie") {
      // Если выбрано худи, открываем переднюю сторону худи
      setCurrentTemplate(hoodieSides["hoodie-front"]);
    } else {
      setCurrentTemplate(template);
    }
  };

  const handleBackToSelector = () => {
    setCurrentTemplate(null);
    setUserImage(null);
  };

  const switchTemplate = (templateId: string) => {
    // Ищем в сторонах футболки
    let newTemplate = tshirtSides[templateId];

    // Если не нашли, ищем в сторонах худи
    if (!newTemplate) {
      newTemplate = hoodieSides[templateId];
    }

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
          tshirtSides={tshirtSides}
          hoodieSides={hoodieSides}
        />
      )}
    </div>
  );
}

export default App;
