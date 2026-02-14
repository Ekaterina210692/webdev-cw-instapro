import { renderUploadImageComponent } from './upload-image-component.js';

export function renderAddPostPageComponent({ appEl, onAddPostClick }) {
    const render = () => {
    appEl.innerHTML = `
      <div class="page-container">
        <div class="header-container"></div>
        <div class="add-post-form">
          <div class="upload-image-container"></div>
          <textarea class="post-description" placeholder="Описание..."></textarea>
          <button class="button" id="add-button">Добавить</button>
        </div>
      </div>
    `;

    // Интеграция компонента загрузки изображения
    renderUploadImageComponent({
      element: appEl.querySelector('.upload-image-container'),
      onImageUrlChange: (url) => {
        imageUrl = url;
      }
    });

    document.getElementById('add-button').addEventListener('click', () => {
      const description = appEl.querySelector('.post-description').value;
      const imageUrl = appEl.querySelector('.upload-image-container').imageUrl;

      if (!imageUrl) {
        alert('Выберите изображение');
        return;
      }

      onAddPostClick({
        description,
        imageUrl
      });
    });
  };

  render();
}
