export default {
  fetch(request: Request) {
    return new Response("Hello World from raw worker!");
  }
}
