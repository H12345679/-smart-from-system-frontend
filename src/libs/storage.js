/**
 * 存储localStorage
 */
export const setStore = (name, content) => {
  if (!name) return
  if (typeof content !== 'string') {
    console.log("not String");
    content = JSON.stringify(content)
  }
  window.localStorage.setItem(`${name.toUpperCase()}`, content)
}

/**
 * 获取localStorage
 */
export const getStore = name => {
  if (!name) return
  return window.localStorage.getItem(`${name.toUpperCase()}`)
}

/**
 * 删除localStorage
 */
export const removestore = name => {
  if (!name) return
  window.localStorage.removeItem(`${name.toUpperCase()}`)
}
