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

Important : GitHub Pages est statique. Un bouton dans le navigateur ne peut pas modifier directement le fichier JSON du repo pour tous les utilisateurs sans backend ou authentification GitHub. Ici, les ajouts sont sauvegardes localement, puis tu peux cliquer sur `Exporter JSON`, remplacer `data/lineups.json` dans le repo, commit, et tous les utilisateurs verront la nouvelle base.

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
