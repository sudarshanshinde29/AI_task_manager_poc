export default {
    async fetch(request: Request, env: any, ctx: ExecutionContext) {
      const answer = await env.AI.run("@cf/meta/llama-2-7b-chat-int8", {
        messages: [{ role: "user", content: `What is the square root of 9?` }],
      });
  
      return new Response(JSON.stringify(answer));
    },
  };
  