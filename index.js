import { getPosts } from "./api.js";
import { renderAddPostPageComponent } from "./components/add-post-page-component.js";
import { renderAuthPageComponent } from "./components/auth-page-component.js";
import {
  ADD_POSTS_PAGE,
  AUTH_PAGE,
  LOADING_PAGE,
  POSTS_PAGE,
  USER_POSTS_PAGE,
} from "./routes.js";
import { renderPostsPageComponent } from "./components/posts-page-component.js";
import { renderLoadingPageComponent } from "./components/loading-page-component.js";
import {
  getUserFromLocalStorage,
  removeUserFromLocalStorage,
  saveUserToLocalStorage,
} from "./helpers.js";

export let user = getUserFromLocalStorage();
export let page = null;
export let posts = [];

const getToken = () => {
  const token = user ? `Bearer ${user.token}` : undefined;
  return token;
};

export const logout = () => {
  user = null;
  removeUserFromLocalStorage();
  goToPage(POSTS_PAGE);
};

/**
 * Включает страницу приложения
 */
export const goToPage = (newPage, data) => {
  if (
    [
      POSTS_PAGE,
      AUTH_PAGE,
      ADD_POSTS_PAGE,
      USER_POSTS_PAGE,
      LOADING_PAGE,
    ].includes(newPage)
  ) {
    if (newPage === ADD_POSTS_PAGE) {
      /* Если пользователь не авторизован, то отправляем его на страницу авторизации перед добавлением поста */
      page = user ? ADD_POSTS_PAGE : AUTH_PAGE;
      return renderApp();
    }

    if (newPage === POSTS_PAGE) {
      page = LOADING_PAGE;
      renderApp();

      return getPosts({ token: getToken() })
        .then((newPosts) => {
          page = POSTS_PAGE;
          posts = newPosts;
          renderApp();
        })
        .catch((error) => {
          console.error(error);
          goToPage(POSTS_PAGE);
        });
    }

    if (newPage === USER_POSTS_PAGE) {
      // @@TODO: реализовать получение постов юзера из API
      console.log("Открываю страницу пользователя: ", data.userId);
      page = USER_POSTS_PAGE;
      posts = [];
      return renderApp();
    }

    page = newPage;
    renderApp();

    return;
  }

  throw new Error("страницы не существует");
};

const renderApp = () => {
  const appEl = document.getElementById("app");
  if (page === LOADING_PAGE) {
    return renderLoadingPageComponent({
      appEl,
      user,
      goToPage,
    });
  }

  if (page === AUTH_PAGE) {
    return renderAuthPageComponent({
      appEl,
      setUser: (newUser) => {
        user = newUser;
        saveUserToLocalStorage(user);
        goToPage(POSTS_PAGE);
      },
      user,
      goToPage,
    });
  }

  if (page === ADD_POSTS_PAGE) {
    return renderAddPostPageComponent({
      appEl,
      async onAddPostClick({ description, imageUrl }) {
        try {
          // Проверяем наличие токена
          const token = getToken();
          if (!token) {
            throw new Error("Нет авторизации");
          }

          // Отправляем данные на сервер
          const response = await fetch(`${postsHost}/posts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
            body: JSON.stringify({
              description,
              imageUrl,
            }),
          });

          if (!response.ok) {
            throw new Error("Ошибка при создании поста");
          }
          goToPage(POSTS_PAGE);
        } catch (error) {
          console.error("Ошибка при добавлении поста:", error);
          alert("Не удалось добавить пост. Попробуйте позже.");
        }
      },
    });
  }


  if (page === POSTS_PAGE) {
    return renderPostsPageComponent({
      appEl,
      posts,
      goToPage,
    });
  }

  if (page === USER_POSTS_PAGE) {
    // @TODO: реализовать страницу с фотографиями отдельного пользвателя
     (async () => {
    try {
      const userId = data.userId;
      const response = await fetch(`${postsHost}/users/${userId}/posts`, {
        method: "GET",
        headers: {
          Authorization: getToken(),
        },
      });

      if (!response.ok) {
        throw new Error("Ошибка при получении постов пользователя");
      }

      const userPosts = await response.json();
      posts = userPosts;

      appEl.innerHTML = `
        <div class="user-posts-container">
          <h2>Посты пользователя ${userId}</h2>
          ${userPosts.map(post => `
            <div class="user-post">
              <img src="${post.imageUrl}" alt="Пост">
              <p>${post.description}</p>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      console.error("Ошибка:", error);
      appEl.innerHTML = "Не удалось загрузить посты пользователя";
    }
    return;
  })
}
};

// Обработка ошибок
async function handleError(error) {
  console.error("Произошла ошибка:", error);
  alert("Произошла ошибка. Попробуйте позже.");
}

// Начальная загрузка
goToPage(POSTS_PAGE);

// Дополнительные обработчики
window.addEventListener("popstate", () => {
  goToPage(POSTS_PAGE);
});

// Функция для обновления токена
async function refreshToken() {
  try {
    const response = await fetch(`${baseHost}/api/user/refresh`, {
      method: "POST",
      headers: {
        Authorization: getToken(),
      },
    });

    if (!response.ok) {
      logout();
      return;
    }

    const newUser = await response.json();
    user = newUser;
    saveUserToLocalStorage(user);
  } catch (error) {
    console.error("Ошибка обновления токена:", error);
    logout();
  }
}
