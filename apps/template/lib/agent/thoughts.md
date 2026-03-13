# Shopping Assistant Agent Thoughts

- Assistant available on every page
- Carries context on the user and current page as form of agent context
- Based on user status (logged in user or not) the agent gets different tools and system prompt since it can help with user actions like adding addresses
- Page context would be cool so we can recommend prompts or browsing tips
- We need all sources to be available from Shopify collections and search
- `json-render` is the way to go for rendering
- I am building an in-browser navigation helper that outputs tools and allows you to control navigation from an agent inside a page

## Context to Carry

- User state and info
- Page context like current page type (browsing/pdp/cart)
- Locale since we want a localized agent
- If someone switches locale what should we do?

## Chat Persistence

- How are we going to handle saving chats?
- Normally I'd say DB but we don't want a separate db
- Then Shopify but user might not even have a cart
- So most likely local in the browser

## Tool Design

- Will we create focused designated tools for each action with manual GraphQL calls or will we go for schema access to the agent (not sure if I like this)
- Should we reuse the existing operations for tool calls or create separate, they may have different field requirements etc

## Scope

- How far should we go? Add evals with evalite etc?
- It'd be kinda cool that this agent is an amazing example of how to build agents

## Security

- Watch out with prompt injection like page and user context being sent and added to the system prompt
- Should all be fetched on the server
