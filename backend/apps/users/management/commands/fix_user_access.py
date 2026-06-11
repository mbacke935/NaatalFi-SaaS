from django.core.management.base import BaseCommand, CommandError

from apps.users.models import CustomUser


class Command(BaseCommand):
    help = "Inspecte ou repare l'acces d'un utilisateur."

    def add_arguments(self, parser):
        parser.add_argument('email')
        parser.add_argument('--role', choices=CustomUser.Role.values)
        parser.add_argument('--verify', action='store_true')
        parser.add_argument('--activate', action='store_true')
        parser.add_argument('--staff', action='store_true')
        parser.add_argument('--superuser', action='store_true')
        parser.add_argument('--password')

    def handle(self, *args, **options):
        email = options['email'].strip().lower()
        try:
            user = CustomUser.objects.get(email__iexact=email)
        except CustomUser.DoesNotExist as exc:
            raise CommandError(f"Utilisateur introuvable: {email}") from exc

        changed = []

        if options['role']:
            user.role = options['role']
            changed.append('role')
        if options['verify']:
            user.is_verified = True
            changed.append('is_verified')
        if options['activate']:
            user.is_active = True
            changed.append('is_active')
        if options['staff']:
            user.is_staff = True
            changed.append('is_staff')
        if options['superuser']:
            user.is_superuser = True
            user.is_staff = True
            changed.extend(['is_superuser', 'is_staff'])
        if options['password']:
            user.set_password(options['password'])
            changed.append('password')

        if changed:
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Utilisateur mis a jour: {email}"))
        else:
            self.stdout.write("Aucune modification appliquee.")

        self.stdout.write(
            f"email={user.email} role={user.role} "
            f"verified={user.is_verified} active={user.is_active} "
            f"staff={user.is_staff} superuser={user.is_superuser}"
        )
