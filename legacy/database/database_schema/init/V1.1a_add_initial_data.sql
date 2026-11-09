insert into the_system.tenants (name, organization, website, notes, message)
values (
           'root_org',
           'Root Organization',
           'https://compmositecode.blog',
           'The root organziation for this deployment.',
           'Root org start.');

insert into the_system.users (tenant_id, username, password, email, notes, message)
values (
           (SELECT tenant_id FROM the_system.tenants WHERE name = 'root_org'),
           'root',
           'changeThis!',
           'admin@...com',
           'Root account',
           'Root account initiated.');

insert into the_system.roles (tenant_id, name, can_add, can_edit, can_delete, notes, message)
values (
           (SELECT tenant_id FROM the_system.tenants WHERE name = 'root_org'),
           'Administrator',
           true,
           true,
           true,
           'Administrator role, with all permissions.',
           'Initiated.'
       );

insert into the_system.user_roles (user_id, role_id)
values (
           (SELECT users.user_id FROM the_system.users WHERE username = 'root'),
           (SELECT roles.role_id FROM the_system.roles WHERE name='Administrator')
       );