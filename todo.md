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
- [x] Sistema de busca global com Cmd+K (cmdk)
- [x] Seção de depoimentos com carrossel automático na landing page
- [x] Modo claro/escuro com toggle e Design Tokens light
- [x] Adaptar layout mobile completo e corrigir erros de responsividade
- [x] Lazy loading nas páginas com React.lazy() e Suspense
- [x] Breadcrumbs de navegação nas páginas internas
- [x] Pull-to-refresh no mobile nas listagens de produtos
- [x] Skeleton loading nos cards Bento Grid durante carregamento
- [x] Toast de boas-vindas personalizado após login
- [x] Página de FAQ com accordion animado
- [x] Sistema de avaliação de produtos (estrelas + comentário)
- [x] Comparador de produtos lado a lado
- [x] Newsletter no footer com captura de e-mail
- [x] Integração com CRM (nexxuscrm.one) - envio automático de leads B2B, pedidos e newsletter
- [x] Mover chamada CRM para server-side (proteger API key)
- [x] Adicionar webhook CRM nos pedidos finalizados
