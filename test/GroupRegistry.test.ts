import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import type { GroupRegistry } from "../typechain-types";

async function deployFixture() {
  const [admin, alice, bob, resolver] = await ethers.getSigners();

  const GroupRegistry = await ethers.getContractFactory("GroupRegistry");
  const groupRegistry = await GroupRegistry.deploy() as unknown as GroupRegistry;

  return { groupRegistry, admin, alice, bob, resolver };
}

describe("GroupRegistry", function () {

  // ── Group Creation ───────────────────────────────────────────────────────────

  describe("createGroup()", function () {
    it("should create a group and emit GroupCreated", async function () {
      const { groupRegistry, admin } = await loadFixture(deployFixture);
      await expect(groupRegistry.connect(admin).createGroup("Bitcoin Maxis"))
        .to.emit(groupRegistry, "GroupCreated");
    });

    it("should return a valid bytes32 groupId", async function () {
      const { groupRegistry, admin } = await loadFixture(deployFixture);
      const tx = await groupRegistry.connect(admin).createGroup("DeFi Degens");
      const receipt = await tx.wait();
      const event = receipt!.logs
        .map((log) => {
          try { return groupRegistry.interface.parseLog(log as any); } catch { return null; }
        })
        .find((e) => e?.name === "GroupCreated");
      expect(event).to.not.be.null;
      expect(event!.args.groupId).to.match(/^0x[0-9a-f]{64}$/i);
    });

    it("should auto-add creator as member and emit MemberJoined", async function () {
      const { groupRegistry, admin } = await loadFixture(deployFixture);
      await expect(groupRegistry.connect(admin).createGroup("Crew"))
        .to.emit(groupRegistry, "MemberJoined");
    });

    it("creator is a member after createGroup", async function () {
      const { groupRegistry, admin } = await loadFixture(deployFixture);
      const tx = await groupRegistry.connect(admin).createGroup("Crew2");
      const receipt = await tx.wait();
      const event = receipt!.logs
        .map((log) => {
          try { return groupRegistry.interface.parseLog(log as any); } catch { return null; }
        })
        .find((e) => e?.name === "GroupCreated");
      const groupId = event!.args.groupId;
      expect(await groupRegistry.isGroupMember(groupId, admin.address)).to.be.true;
    });

    it("should revert with empty name", async function () {
      const { groupRegistry, admin } = await loadFixture(deployFixture);
      await expect(groupRegistry.connect(admin).createGroup(""))
        .to.be.revertedWithCustomError(groupRegistry, "EmptyName");
    });
  });

  // ── Membership ────────────────────────────────────────────────────────────────

  describe("joinGroup()", function () {
    async function createGroup(groupRegistry: GroupRegistry, admin: any) {
      const tx = await groupRegistry.connect(admin).createGroup("Test Group");
      const receipt = await tx.wait();
      const event = receipt!.logs
        .map((log: any) => {
          try { return groupRegistry.interface.parseLog(log); } catch { return null; }
        })
        .find((e: any) => e?.name === "GroupCreated");
      return event!.args.groupId as string;
    }

    it("should add a new member and emit MemberJoined", async function () {
      const { groupRegistry, admin, alice } = await loadFixture(deployFixture);
      const groupId = await createGroup(groupRegistry, admin);
      await expect(groupRegistry.connect(alice).joinGroup(groupId))
        .to.emit(groupRegistry, "MemberJoined")
        .withArgs(groupId, alice.address);
      expect(await groupRegistry.isGroupMember(groupId, alice.address)).to.be.true;
    });

    it("isGroupMember returns false for non-member", async function () {
      const { groupRegistry, admin, bob } = await loadFixture(deployFixture);
      const groupId = await createGroup(groupRegistry, admin);
      expect(await groupRegistry.isGroupMember(groupId, bob.address)).to.be.false;
    });

    it("joinGroup is idempotent — no revert on double join", async function () {
      const { groupRegistry, admin, alice } = await loadFixture(deployFixture);
      const groupId = await createGroup(groupRegistry, admin);
      await groupRegistry.connect(alice).joinGroup(groupId);
      // Second join should not revert
      await expect(groupRegistry.connect(alice).joinGroup(groupId)).to.not.be.reverted;
      // Still a member
      expect(await groupRegistry.isGroupMember(groupId, alice.address)).to.be.true;
    });

    it("should revert joinGroup for non-existent group", async function () {
      const { groupRegistry, alice } = await loadFixture(deployFixture);
      const fakeGroupId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await expect(groupRegistry.connect(alice).joinGroup(fakeGroupId))
        .to.be.revertedWithCustomError(groupRegistry, "GroupNotFound");
    });
  });

  // ── Resolver Assignment ───────────────────────────────────────────────────────

  describe("assignResolver()", function () {
    async function createGroup(groupRegistry: GroupRegistry, admin: any) {
      const tx = await groupRegistry.connect(admin).createGroup("Resolver Group");
      const receipt = await tx.wait();
      const event = receipt!.logs
        .map((log: any) => {
          try { return groupRegistry.interface.parseLog(log); } catch { return null; }
        })
        .find((e: any) => e?.name === "GroupCreated");
      return event!.args.groupId as string;
    }

    it("admin can assign a resolver and event is emitted", async function () {
      const { groupRegistry, admin, resolver } = await loadFixture(deployFixture);
      const groupId = await createGroup(groupRegistry, admin);
      const marketId = ethers.keccak256(ethers.toUtf8Bytes("market1"));
      await expect(groupRegistry.connect(admin).assignResolver(groupId, marketId, resolver.address))
        .to.emit(groupRegistry, "ResolverAssigned")
        .withArgs(marketId, resolver.address, groupId);
    });

    it("getResolver returns the assigned resolver", async function () {
      const { groupRegistry, admin, resolver } = await loadFixture(deployFixture);
      const groupId = await createGroup(groupRegistry, admin);
      const marketId = ethers.keccak256(ethers.toUtf8Bytes("market2"));
      await groupRegistry.connect(admin).assignResolver(groupId, marketId, resolver.address);
      expect(await groupRegistry.getResolver(marketId)).to.equal(resolver.address);
    });

    it("non-admin cannot assign resolver", async function () {
      const { groupRegistry, admin, alice, resolver } = await loadFixture(deployFixture);
      const groupId = await createGroup(groupRegistry, admin);
      const marketId = ethers.keccak256(ethers.toUtf8Bytes("market3"));
      await expect(
        groupRegistry.connect(alice).assignResolver(groupId, marketId, resolver.address)
      ).to.be.revertedWithCustomError(groupRegistry, "NotGroupAdmin");
    });

    it("reverts when assigning zero address as resolver", async function () {
      const { groupRegistry, admin } = await loadFixture(deployFixture);
      const groupId = await createGroup(groupRegistry, admin);
      const marketId = ethers.keccak256(ethers.toUtf8Bytes("market4"));
      await expect(
        groupRegistry.connect(admin).assignResolver(groupId, marketId, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(groupRegistry, "ZeroAddress");
    });
  });
});
