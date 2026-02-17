import { uploadImage, baseHost } from "../api.js";
import { getToken } from '../index.js';
/**
 * Компонент загрузки изображения.
 * Этот компонент позволяет пользователю загружать изображение и отображать его превью.
 * Если изображение уже загружено, пользователь может заменить его.
 *
 * @param {HTMLElement} params.element - HTML-элемент, в который будет рендериться компонент.
 * @param {Function} params.onImageUrlChange - Функция, вызываемая при изменении URL изображения.
 *                                            Принимает один аргумент - новый URL изображения или пустую строку.
 */
export function renderUploadImageComponent({ element, onImageUrlChange }) {
  /**
   * URL текущего изображения.
   * Изначально пуст, пока пользователь не загрузит изображение.
   * @type {string}
   */
  let imageUrl = "";

  /**
   * Функция рендеринга компонента.
   * Отображает интерфейс компонента в зависимости от состояния: 
   * либо форма выбора файла, либо превью загруженного изображения с кнопкой замены.
   */
  const render = () => {
    element.innerHTML = `
      <div class="upload-image">
        ${
          imageUrl
            ? `
            <div class="file-upload-image-container">
              <img class="file-upload-image" src="${imageUrl}" alt="Загруженное изображение">
              <button class="file-upload-remove-button button">Заменить фото</button>
            </div>
            `
            : `
            <label class="file-upload-label secondary-button">
              <input
                type="file"
                class="file-upload-input"
                style="display:none"
              />
              Выберите фото
            </label>
            <p class="file-upload-hint">Допустимые форматы: JPEG, PNG</p>
          `
        }
      </div>
    `;

    // Обработчик выбора файла
    const fileInputElement = element.querySelector(".file-upload-input");
    fileInputElement?.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const labelEl = element.querySelector(".file-upload-label");
      labelEl.setAttribute("disabled", true);
      labelEl.textContent = "Загружаю файл...";

      try {
        const token = getToken();
        if (!token) {
          throw new Error('Необходимо авторизоваться');
        }

        // Проверяем формат файла
        const acceptedTypes = ['image/jpeg', 'image/png'];
        if (!acceptedTypes.includes(file.type)) {
          throw new Error('Неверный формат файла');
        }
        // Загружаем изображение с помощью API
        const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${baseHost}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Ошибка при загрузке файла');
    }

    const data = await response.json();
    imageUrl = data.fileUrl;
        onImageUrlChange(imageUrl);
        render();
      } catch (error) {
        alert(`Ошибка загрузки: ${error.message}`);
        labelEl.removeAttribute("disabled");
        labelEl.textContent = "Выбрать фото";
        fileInputElement.value = '';
      }
    });

    // Обработчик удаления изображения
    element
      .querySelector(".file-upload-remove-button")
      ?.addEventListener("click", () => {
        imageUrl = "";
        onImageUrlChange(imageUrl);
        render();
      });
  };
  render();
}
