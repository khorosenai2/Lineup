# CS2 Lineup Vault

Petite app HTML/CSS/JS statique pour stocker et chercher des lineups CS2.

## Fichiers

- `index.html` : interface de l'application.
- `styles.css` : design responsive.
- `app.js` : ajout, recherche floue, import/export, stockage local.
- `data/lineups.json` : base partageable a mettre dans le repo GitHub.

## Utilisation sur GitHub Pages

1. Mets le contenu de ce dossier a la racine de ton repo GitHub.
2. Active GitHub Pages dans `Settings > Pages`.
3. L'app lit `data/lineups.json` au chargement.

## Acces

L'application affiche un ecran de connexion avant de charger les lineups. Les mots de passe ne sont pas stockes en clair : le JavaScript compare un hash SHA-256 sale.

Comme GitHub Pages est statique, ce verrou reste une protection cote navigateur. Pour une vraie securite serveur, il faudrait ajouter un backend avec sessions et base de donnees.

Important : GitHub Pages est statique. Sans authentification GitHub, les ajouts restent sauvegardes localement dans le navigateur. Pour partager la nouvelle base a tout le monde, utilise `Push GitHub` avec un token GitHub, ou bien `Exporter JSON` puis remplace `data/lineups.json` manuellement.

## Push automatique du JSON vers GitHub

L'app peut maintenant pousser `data/lineups.json` directement sur GitHub avec le bouton `Push GitHub`.

Pour l'utiliser :

1. Sur GitHub, cree un fine-grained personal access token.
2. Limite le token au repo du site.
3. Donne au token la permission `Contents: Read and write`.
4. Dans l'app, connecte-toi, clique `Config GitHub`, puis renseigne :
   - owner / pseudo GitHub
   - repo
   - branche, souvent `main`
   - chemin du JSON, normalement `data/lineups.json`
   - token GitHub
5. Clique `Push GitHub` apres avoir ajoute ou modifie des lineups.

Le token n'est jamais mis dans le JSON ni dans les fichiers du site. Si tu coches `Garder le token sur cet appareil`, il reste dans le stockage local du navigateur.

Docs utiles :

- GitHub Contents API : https://docs.github.com/en/rest/repos/contents
- Tokens GitHub : https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

## Champs d'une lineup

- `name`
- `description`
- `map`
- `place`
- `instructions`
- `result`
- `tags`
- `images.place`
- `images.position`
- `images.aim`
- `images.result`

Les images ajoutees depuis l'app sont compressees et stockees en base64 dans le JSON exporte. Pour une tres grosse base, il sera plus propre de mettre les images dans un dossier `assets/` et de garder leurs chemins dans le JSON.

Dans le formulaire, chaque encadre photo accepte aussi le collage : clique dans l'encadre, puis fais `Ctrl+V` avec une image copiee.
