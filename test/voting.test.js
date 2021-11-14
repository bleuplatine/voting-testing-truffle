const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Voting = artifacts.require('Voting');

contract('Voting', accounts => {
  const owner = accounts[0];
  const voter1 = accounts[1];
  const voter2 = accounts[2];
  const voter3 = accounts[3];
  const voter4 = accounts[4];
  const voter5 = accounts[5];
  const notAVoter = accounts[6];
  const voters = [owner, voter1, voter2, voter3, voter4, voter5];
  let instance;
  // const addAllVoters = async () => {
  //   await Promise.all(voters.map(async voter => {
  //     await instance.addVoter(voter, { from: owner })
  //   }))
  // }

  context('fonctions addVoter() & getVoter()', () => {
    before(async () => {
      instance = await Voting.new({ from: owner });
    });

    it('doit être uniquement le owner', async () => {
      await expectRevert(instance.addVoter(voter2, { from: voter1 }), 'Ownable: caller is not the owner');
    });

    it('ne doit pas être enregistré', async () => {
      await instance.addVoter(voter1, { from: owner });
      await expectRevert(instance.addVoter(voter1, { from: owner }), 'Already registered');
    });

    it('doit enregistrer un voter et le retourner', async () => {
      await instance.addVoter(owner, { from: owner });
      const result = await instance.getVoter(voter1, { from: owner });
      await expect(result.isRegistered).to.be.true;
    });

    it("doit émettre l'event VoterRegistered", async () => {
      const event = await instance.addVoter(voter3, { from: owner });
      expectEvent(event, 'VoterRegistered', { voterAddress: voter3 });
    });

    it('WorkflowStatus doit être RegisteringVoters', async () => {
      await instance.startProposalsRegistering({ from: owner });
      await expectRevert(instance.addVoter(voter1, { from: owner }), 'Voters registration is not open yet');
    });
  });

  context('fonction startProposalsRegistering()', () => {
    it("doit émettre l'event WorkflowStatusChange et modifier le WorkflowStatus à ProposalsRegistrationStarted", async () => {
      instance = await Voting.new({ from: owner });
      const previousStatusId = await instance.workflowStatus();
      const emitEvent = await instance.startProposalsRegistering();
      const newStatusId = await instance.workflowStatus();
      await expectEvent(emitEvent, 'WorkflowStatusChange', { previousStatus: previousStatusId.words[0] + "", newStatus: newStatusId.words[0] + "" });
      expect(newStatusId.words[0]).to.equal(1);
    });
  });

  context('fonctions addProposal() & getOneProposal()', () => {
    before(async () => {
      instance = await Voting.new({ from: owner });
      // addAllVoters();
      await Promise.all(voters.map(async voter => {
        await instance.addVoter(voter, { from: owner })
      }))
      await instance.startProposalsRegistering();
    });

    it('doit être un voter enregistré', async () => {
      await expectRevert(instance.addProposal("blabla", { from: notAVoter }), "You're not a voter");
    });

    it('la proposition doit être non vide', async () => {
      await expectRevert(instance.addProposal("", { from: voter1 }), 'Vous ne pouvez pas ne rien proposer');
    });

    it('doit enregistrer des propositions et les retourner', async () => {
      await instance.addProposal("Rond point", { from: voter1 });
      await instance.addProposal("Panneau Stop", { from: voter2 });
      const prop0 = await instance.getOneProposal(0);
      const prop1 = await instance.getOneProposal(1);
      expect(prop0.description).to.equal("Rond point");
      expect(prop1.description).to.equal("Panneau Stop");
    });

    it("doit émettre l'event ProposalRegistered", async () => {
      const emitEvent = await instance.addProposal("Couper arbre", { from: voter3 });
      expectEvent(emitEvent, 'ProposalRegistered', { proposalId: "2" });
    });
  });

  context('fonction setVote()', () => {
    let prop0Count = 0;
    let prop1Count = 0;

    before(async () => {
      instance = await Voting.new({ from: owner });
      // addAllVoters();
      await Promise.all(voters.map(async voter => {
        await instance.addVoter(voter, { from: owner })
      }))
      await instance.startProposalsRegistering();
      await instance.addProposal("Rond point", { from: voter1 });
      await instance.addProposal("Panneau Stop", { from: voter2 });
      await instance.endProposalsRegistering();
      await instance.startVotingSession();
    });

    it("ne peut voter qu'une fois", async () => {
      await instance.setVote(1, { from: voter1 });
      prop1Count++
      await expectRevert(instance.setVote(0, { from: voter1 }), 'You have already voted');
      const everVoted = await instance.getVoter(voter1);
      await expect(everVoted.hasVoted).to.be.true;
    });

    it("la proposition doit exister", async () => {
      await expectRevert(instance.setVote(5, { from: voter2 }), 'Proposal not found');
    });

    it("doit émettre l'event Voted", async () => {
      const emitEvent = await instance.setVote(1, { from: voter2 });
      prop1Count++
      expectEvent(emitEvent, 'Voted', { voter: voter2 + "", proposalId: "1" });
    });

    it("doit enregistrer les votes", async () => {
      await instance.setVote(0, { from: voter3 });
      prop0Count++
      await instance.setVote(1, { from: voter4 });
      prop1Count++
      await instance.setVote(0, { from: voter5 });
      prop0Count++
      const prop0 = await instance.getOneProposal(0);
      const prop1 = await instance.getOneProposal(1);
      expect(prop0.voteCount).to.equal(prop0Count + "");
      expect(prop1.voteCount).to.equal(prop1Count + "");
    });
  });

  context('fonction tallyVotes() & getWinner()', () => {
    let prop1Count = 0;

    before(async () => {
      instance = await Voting.new({ from: owner });
      // addAllVoters();
      await Promise.all(voters.map(async voter => {
        await instance.addVoter(voter, { from: owner })
      }))
      await instance.startProposalsRegistering();
      await instance.addProposal("Rond point", { from: voter1 });
      await instance.addProposal("Panneau Stop", { from: voter3 });
      await instance.endProposalsRegistering();
      await instance.startVotingSession();
      await instance.setVote(1, { from: voter1 });
      prop1Count++
      await instance.setVote(1, { from: voter2 });
      prop1Count++
      await instance.setVote(0, { from: voter3 });
      await instance.setVote(1, { from: voter4 });
      prop1Count++
      await instance.setVote(0, { from: voter5 });
      await instance.endVotingSession();
    });

    it("doit décompter les votes et retourner le gagnant", async () => {
      await instance.tallyVotes();
      const result = await instance.getWinner()
      expect(result.voteCount).to.equal(prop1Count + "");
      expect(result.description).to.equal('Panneau Stop');
    });
  });

})