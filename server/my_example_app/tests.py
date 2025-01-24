# Create your tests here.

from django.test import TestCase

from .models import Entry


class EntryModelTest(TestCase):
	def setUp(self):
		Entry.objects.create(title="Test Entry", content="This is a test content.")

	def test_entry_content(self):
		entry = Entry.objects.get(title="Test Entry")
		self.assertEqual(entry.content, "This is a test content.")
