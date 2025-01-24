from django.shortcuts import render, redirect, get_object_or_404
from .models import Entry
from .forms import EntryForm


def entry_list_create(request):
    if request.method == 'POST':
        form = EntryForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('entry_list_create')
    else:
        form = EntryForm()

    entries = Entry.objects.all()
    return render(request, 'entry_list_create.html', {'form': form, 'entries': entries})

def delete_entry(request, entry_id):
    entry = get_object_or_404(Entry, id=entry_id)
    entry.delete()
    return redirect('entry_list_create')