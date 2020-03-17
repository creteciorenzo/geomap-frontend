import wings from 'wings4'
// "async" is optional
export default async ({
  app,
  router,
  Vue
}) => {
  Vue.prototype.$dbCon = wings('http://localhost:3030')
}
