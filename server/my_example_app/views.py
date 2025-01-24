from django.shortcuts import render, redirect, get_object_or_404
from .models import Entry
from .forms import EntryForm
import logging

logger = logging.getLogger(__name__)

def entry_list_create(request):
    if request.method == 'POST':
        form = EntryForm(request.POST)
        if form.is_valid():
            form.save()
            logger.info('New entry added')
            return redirect('entry_list_create')
    else:
        form = EntryForm()

    entries = Entry.objects.all()
    return render(request, 'entry_list_create.html', {'form': form, 'entries': entries})

def delete_entry(request, entry_id):
    entry = get_object_or_404(Entry, id=entry_id)
    entry.delete()
    logger.warning('Entry deleted')
    return redirect('entry_list_create')