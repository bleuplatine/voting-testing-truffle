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
ou (pour obtenir le pourcentage de couverture des fonctions testées)  :

```bash
truffle run coverage
```

## Description des tests
```bash
test > voting.test.js
```
Chaque contexte de test est dédié au test d'1 ou 2 fonctions liées. 

Pour chaque contexte un hook **before** lancera l'environnement nécessaire à l'exécution de chaque cas de test (une nouvelle instance de Voting, les variables des comptes utilisateurs, une instance de statut, ...).

```javascript
    before(async () => {
      instance = await Voting.new({ from: owner });
      await Promise.all(voters.map(async voter => {
        await instance.addVoter(voter, { from: owner })
      }))
      await instance.startProposalsRegistering();
    });
```

Exemple de test d'un **require** par le biais de la fonction **expectRevert** (librairie @openzeppelin/test-helpers).

```javascript
    it('doit être uniquement le owner', async () => {
      await expectRevert(instance.addVoter(voter2, { from: voter1 }), 'Ownable: caller is not the owner');
    });
```
Exemple de test d'un **event** par le biais de la fonction **expectEvent** (librairie @openzeppelin/test-helpers).

```javascript
   it("doit émettre l'event VoterRegistered", async () => {
      const event = await instance.addVoter(voter3, { from: owner });
      expectEvent(event, 'VoterRegistered', { voterAddress: voter3 });
    });
```
Exemple de test dédié à la modification d'un **enum** représenté par un indice numérique.

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
