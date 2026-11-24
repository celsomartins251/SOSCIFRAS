# SOS CIFRAS

Aplicativo web responsivo para organizar, editar e transpor cifras e setlists.

## GitHub Pages
Em Settings → Pages, selecione Deploy from a branch, branch main e pasta /(root). O ponto de entrada é index.html.
URL esperada: https://celsomartins251.github.io/SOSCIFRAS/

## Recursos implementados
- Busca local por título/artista; leitura e edição de cifras.
- Transposição de acordes e baixos slash; ajuste de fonte, rolagem automática e impressão.
- Favoritos e setlists: criação, renomeação, inclusão, remoção e reordenação.
- Pesquisa externa Google/Bing e importação manual de cifra copiada.
- Tema preto/dourado e opção clara.
- Modo Banda com Firebase Authentication e Cloud Firestore: líder cria grupo por código, membros entram, recebem repertório/setlists e acompanham a música atual selecionada pelo líder.

## Firebase necessário para o Modo Banda
1. Ative Authentication → Email/Password no projeto Firebase.
2. Ative Cloud Firestore.
3. Na aba Banda, informe apiKey, authDomain, projectId e appId da configuração Web do Firebase.
4. Publique firestore.rules nas regras do Firestore.
5. Crie uma conta em cada aparelho. O líder cria um grupo e compartilha o código.

A configuração Web é armazenada localmente no navegador. Não há credenciais privadas no repositório. As regras permitem a consulta autenticada de um grupo por código; trate o código como convite e compartilhe apenas com os músicos.

## Limites conhecidos
- Sem Firebase configurado, os dados ficam apenas no armazenamento local daquele navegador.
- Pesquisa externa abre Google/Bing; o usuário escolhe a fonte e importa o texto manualmente. O app não raspa sites nem importa catálogos automaticamente.
- O modo Banda exige teste real com duas contas/dispositivos após configurar o Firebase.
- Um documento Firestore tem limite de 1 MiB; repertórios muito extensos precisam ser divididos em coleções.
