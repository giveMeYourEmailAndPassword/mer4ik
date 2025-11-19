import type { MerchTemplate } from '../types';

interface TemplateSelectorProps {
  templates: MerchTemplate[];
  onTemplateSelect: (template: MerchTemplate) => void;
}

export const TemplateSelector = ({
  templates,
  onTemplateSelect
}) => {

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Создай свой мерч
        </h1>
        <p className="text-gray-600">
          Выбери товар и загрузи свой дизайн
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateSelect(template)}
            className="bg-white rounded-2xl shadow-lg overflow-hidden
                     hover:shadow-xl transition-all duration-300
                     active:scale-95 group"
          >
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
              <img
                src={template.imageUrl}
                alt={template.name}
                className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 capitalize">
                {template.name}
              </h3>
            </div>
          </button>
        ))}
      </div>

      {/* Upload Button */}
      <div className="fixed bottom-8 left-0 right-0 px-4">
        <button
          className="w-full bg-blue-600 text-white py-4 rounded-full
                   font-semibold shadow-lg active:scale-95 transition-transform
                   hover:bg-blue-700"
          onClick={() => {
            // Можно добавить функцию загрузки собственного шаблона
          }}
        >
          Загрузить свой шаблон
        </button>
      </div>
    </div>
  );
};