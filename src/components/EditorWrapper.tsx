import React, { useState, useEffect } from 'react';
import type { MerchTemplate, UserImage } from '../types';
import { SimpleEditor } from './SimpleEditor';

interface EditorWrapperProps {
  template: MerchTemplate;
  onBack: () => void;
  userImage: UserImage | null;
  setUserImage: (image: UserImage | null) => void;
  onSwitchTemplate: (templateId: string) => void;
}

export const EditorWrapper = ({
  template,
  onBack,
  userImage,
  setUserImage,
  onSwitchTemplate
}: EditorWrapperProps) => {
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    // Проверяем, доступен ли react-konva
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('react-konva');
      setUseFallback(false);
    } catch (err) {
      console.warn('react-konva not available, using fallback editor');
      setUseFallback(true);
    }
  }, []);

  if (useFallback) {
    return (
      <SimpleEditor
        template={template}
        onBack={onBack}
        userImage={userImage}
        setUserImage={setUserImage}
        onSwitchTemplate={onSwitchTemplate}
      />
    );
  }

  return (
    <SimpleEditor
      template={template}
      onBack={onBack}
      userImage={userImage}
      setUserImage={setUserImage}
      onSwitchTemplate={onSwitchTemplate}
    />
  );
};