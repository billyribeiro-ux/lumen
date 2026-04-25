<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { ActionData, PageData } from './$types';

  let {
    data,
    form,
  }: {
    data: PageData;
    form: ActionData;
  } = $props();

  const orgs = $derived(data.memberOrgs);
  const selectedOrgId = $derived(data.selectedOrgId ?? '');
  const myRole = $derived(data.myRole);
  const canManage = $derived(myRole === 'owner' || myRole === 'admin');
</script>

<svelte:head>
  <title>Team — Lumen</title>
</svelte:head>

<main class="team-page">
  <header>
    <h1>Team</h1>
    <p>Invite members, change roles, and revoke pending invitations.</p>
  </header>

  {#if orgs.length === 0}
    <p>You're not a member of any organization yet.</p>
  {:else}
    <section class="org-switcher">
      <label>
        <span>Organization</span>
        <select
          value={selectedOrgId}
          onchange={(e) => goto(`?org=${(e.currentTarget as HTMLSelectElement).value}`)}
        >
          {#each orgs as o}
            <option value={o.id}>{o.name}{o.role === 'owner' ? ' (owner)' : ''}</option>
          {/each}
        </select>
      </label>
    </section>

    <section>
      <h2>Members</h2>
      <ul>
        {#each data.members as m}
          <li>
            <div>
              <strong>{m.name}</strong> <span class="email">{m.email}</span>
            </div>
            <div class="member-meta">
              <span class="role role-{m.role}">{m.role}</span>
              {#if canManage && m.role !== 'owner'}
                <form method="POST" action="?/removeMember" use:enhance>
                  <input type="hidden" name="organizationId" value={selectedOrgId} />
                  <input type="hidden" name="userId" value={m.userId} />
                  <button type="submit">Remove</button>
                </form>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    </section>

    {#if canManage}
      <section>
        <h2>Invite a teammate</h2>
        <form method="POST" action="?/invite" use:enhance class="invite-form">
          <input type="hidden" name="organizationId" value={selectedOrgId} />
          <label>
            <span>Email</span>
            <input type="email" name="email" autocomplete="email" required />
          </label>
          <label>
            <span>Role</span>
            <select name="role">
              <option value="viewer">viewer</option>
              <option value="editor">editor</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <button type="submit">Send invite</button>
        </form>
        {#if form && 'invited' in form}
          <p class="form-success" role="status">Invite sent to {form.invited}.</p>
        {:else if form && 'message' in form && form.message}
          <p class="form-error" role="alert">{form.message}</p>
        {/if}

        <h3>Pending invites</h3>
        {#if data.invites.length === 0}
          <p class="empty">No pending invites.</p>
        {:else}
          <ul>
            {#each data.invites as inv}
              <li>
                <div>
                  <strong>{inv.email}</strong>
                  <span class="role role-{inv.role}">{inv.role}</span>
                </div>
                <form method="POST" action="?/revokeInvite" use:enhance>
                  <input type="hidden" name="organizationId" value={selectedOrgId} />
                  <input type="hidden" name="inviteId" value={inv.id} />
                  <button type="submit">Revoke</button>
                </form>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}
  {/if}
</main>

<style>
  .team-page {
    inline-size: min(48rem, 100%);
    margin-inline: auto;
    padding: 2rem 1.5rem;
    display: grid;
    gap: 2rem;
    font-family: 'Inter', system-ui, sans-serif;
  }
  h1 {
    font-size: clamp(1.75rem, 1rem + 2vw, 2.25rem);
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-block: 0;
  }
  h2 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-block: 0 0.75rem;
  }
  h3 {
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    opacity: 0.6;
    margin-block: 1.5rem 0.5rem;
  }
  section {
    border-block-start: 1px solid color-mix(in oklch, currentColor 10%, transparent);
    padding-block-start: 1.25rem;
  }
  .org-switcher select,
  .invite-form select,
  input {
    padding: 0.5rem 0.75rem;
    border: 1px solid color-mix(in oklch, currentColor 20%, transparent);
    border-radius: 0.5rem;
    background: transparent;
    color: inherit;
    font: inherit;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.5rem;
  }
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.625rem 0.875rem;
    border-radius: 0.5rem;
    background: color-mix(in oklch, currentColor 4%, transparent);
    gap: 1rem;
  }
  .email {
    opacity: 0.7;
    margin-inline-start: 0.5rem;
  }
  .role {
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    background: color-mix(in oklch, currentColor 10%, transparent);
  }
  .role-owner {
    background: oklch(0.72 0.18 260 / 0.2);
  }
  .role-admin {
    background: oklch(0.66 0.14 200 / 0.2);
  }
  .member-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  button {
    padding: 0.375rem 0.75rem;
    border-radius: 0.4rem;
    border: 1px solid color-mix(in oklch, currentColor 20%, transparent);
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .invite-form {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 0.75rem;
    align-items: end;
  }
  .invite-form label {
    display: grid;
    gap: 0.25rem;
  }
  .invite-form span {
    font-size: 0.875rem;
    opacity: 0.7;
  }
  .invite-form button {
    padding: 0.5rem 1rem;
    background: var(--color-accent, oklch(0.72 0.2 260));
    color: oklch(0.99 0 0);
    border-color: transparent;
    align-self: end;
  }
  .empty {
    opacity: 0.6;
    margin-block: 0.25rem;
  }
  .form-error {
    color: oklch(0.62 0.18 25);
    font-size: 0.875rem;
  }
  .form-success {
    color: oklch(0.6 0.16 145);
    font-size: 0.875rem;
  }
</style>
