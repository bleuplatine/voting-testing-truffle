# Tester Voting.sol sous Truffle


## Installation

Truffle doit être installé.

```bash
npm install
```
## Utilisation
Lancer Ganache dans un 1er terminal :

```bash
ganache-cli
```
Lancer les tests dans un 2nd terminal :

```bash
truffle test
```
ou 

```bash
truffle run coverage
```
pour obtenir le pourcentage de couverture des fonctions testées (librairie *solidity-coverage*)  :


```bash
  Contract: Voting
    fonctions addVoter() & getVoter()
      √ doit être uniquement le owner (1614ms)
      √ ne doit pas être enregistré (671ms)
      √ doit enregistrer un voter et le retourner (379ms)
      √ doit émettre l event VoterRegistered (246ms)
      √ WorkflowStatus doit être RegisteringVoters (605ms)
    fonction startProposalsRegistering()
      √ doit émettre l event WorkflowStatusChange et modifier le WorkflowStatus à ProposalsRegistrationStarted (849ms)
    fonctions addProposal() & getOneProposal()
      √ doit être un voter enregistré (350ms)
      √ la proposition doit être non vide (364ms)
      √ doit enregistrer des propositions et les retourner (1217ms)
      √ doit émettre l event ProposalRegistered (385ms)
    fonction setVote()
      √ ne peut voter qu une fois (1063ms)
      √ la proposition doit exister (321ms)
      √ doit émettre l event Voted (487ms)
      √ doit enregistrer les votes (1874ms)
    fonction tallyVotes() & getWinner()
      √ doit décompter les votes et retourner le gagnant (787ms)


  15 passing (29s)

-------------|----------|----------|----------|----------|----------------|
File         |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-------------|----------|----------|----------|----------|----------------|
 contracts\  |    68.33 |       55 |    85.71 |    67.19 |                |
  Voting.sol |    68.33 |       55 |    85.71 |    67.19 |... 175,177,178 |
-------------|----------|----------|----------|----------|----------------|
All files    |    68.33 |       55 |    85.71 |    67.19 |                |
-------------|----------|----------|----------|----------|----------------|

```




## Description des tests
```bash
test > voting.test.js
```
Chaque contexte de test est dédié au test d'1 ou 2 fonctions liées. 

Pour chaque contexte un hook **before** lance l'environnement nécessaire avant l'exécution successive des cas de test (une nouvelle instance de Voting, les variables des comptes utilisateurs, une instance de statut, ...).

```javascript
    before(async () => {
      instance = await Voting.new({ from: owner });
      await Promise.all(voters.map(async voter => {
        await instance.addVoter(voter, { from: owner })
      }))
      await instance.startProposalsRegistering();
    });
```

Exemple de test d'un **require** par le biais de la fonction `expectRevert` (librairie *@openzeppelin/test-helpers*).

```javascript
    it('doit être uniquement le owner', async () => {
      await expectRevert(instance.addVoter(voter2, { from: voter1 }), 'Ownable: caller is not the owner');
    });
```
Exemple de test d'un **event** par le biais de la fonction `expectEvent` (librairie *@openzeppelin/test-helpers*).

```javascript
   it("doit émettre l'event VoterRegistered", async () => {
      const event = await instance.addVoter(voter3, { from: owner });
      expectEvent(event, 'VoterRegistered', { voterAddress: voter3 });
    });
```
Exemple de test de la fonction `startProposalsRegistering` dont l'objectif est de modifier le statut du process de vote par le biais d'un **enum**. Ici on récupère l'indice de l'enum sélectionné avant (`previousStatusId.words[0]`) et aprés (`newStatusId.words[0]`) l'appel de la fonction `startProposalsRegistering`.

```javascript
  context('fonction startProposalsRegistering()', () => {
    it("doit émettre l'event WorkflowStatusChange et modifier le WorkflowStatus à ProposalsRegistrationStarted", async () => {
      instance = await Voting.new({ from: owner });
      const previousStatusId = await instance.workflowStatus();
      const emitEvent = await instance.startProposalsRegistering();
      const newStatusId = await instance.workflowStatus();
      await expectEvent(emitEvent, 'WorkflowStatusChange', { previousStatus: previousStatusId.words[0] + "", newStatus: newStatusId.words[0] + "" });
      expect(newStatusId.words[0]).to.equal(1);
    });
```
