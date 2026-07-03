# NexxusTECH - Project TODO

## Design & Estrutura Base
- [x] Design Tokens globais em CSS (cores, tipografia, espaçamentos, border-radius)
- [x] Fonte Inter via Google Fonts
- [x] Tema escuro premium (#1D1D1F) com azul de destaque

## Banco de Dados
- [x] Schema: tabelas products (com type software/course), categories, orders, order_items, cart_items, b2b_leads, chat_messages
- [x] Migrations aplicadas
- [x] Seed data com produtos e cursos de exemplo

## Componentes Globais
- [x] Navbar com efeito glassmorphism (blur/frosted glass)
- [x] Footer profissional
- [x] Layout base responsivo

## Páginas Públicas
- [x] Landing page hero com tipografia grande, CTA e layout assimétrico estilo Apple
- [x] Catálogo de softwares (4 categorias, Bento Grid, border-radius 16-24px)
- [x] Catálogo de cursos digitais com cards de produto
- [x] Página de detalhes do produto (software/curso)
- [x] Seção B2B com formulário de contato corporativo

## Área do Cliente
- [x] Autenticação via OAuth (já configurada)
- [x] Dashboard do cliente com histórico de pedidos
- [x] Acesso aos produtos adquiridos (seção "Meus Produtos" na conta)

## Carrinho e Checkout
- [x] Carrinho de compras funcional
- [x] Fluxo de checkout com Stripe Checkout Session (redirect para pagamento)
- [x] Integração Stripe para pagamentos (checkout session + webhook)

## Chatbot IA
- [x] Chatbot virtual flutuante integrado à plataforma
- [x] Respostas sobre produtos, auxílio na escolha e guia de compra

## E-mails Automáticos
- [x] Envio de notificação ao proprietário quando novo pedido é realizado
- [x] Notificação ao proprietário e atualização de status via Stripe webhook

## Painel Admin
- [x] Gerenciamento de produtos e cursos
- [x] Visualização de pedidos
- [x] Gerenciamento de preços

## Melhorias Visuais
- [x] Animações de rolagem (scroll animations) nos blocos Bento Grid e textos principais
- [x] Micro-interações nos botões CTA (scale 0.97 no :active)
- [x] Animação de contagem progressiva nos números estatísticos
- [x] Transições suaves entre páginas com AnimatePresence
