function App() {
    const { Container, Row, Col } = ReactBootstrap;
    return (
        <Container>
            <Row>
                <Col md={{ offset: 3, span: 6 }}>
                    <TodoListCard />
                </Col>
            </Row>
        </Container>
    );
}

function TodoListCard() {
    const [items, setItems] = React.useState(null);
    const [loadingExport, setLoadingExport] = React.useState(false);
    const [loadingImport, setLoadingImport] = React.useState(false);

    React.useEffect(() => {
        fetch('/items')
            .then(r => {
                if (!r.ok) throw new Error('Failed to fetch items');
                return r.json();
            })
            .then(setItems)
            .catch(() => alert('Error loading items'));
    }, []);

    const onNewItem = React.useCallback(
        newItem => {
            setItems([...items, newItem]);
        },
        [items]
    );

    const handleExport = () => {
        setLoadingExport(true);
        fetch('/csv/export')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to export data');
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'todo_list.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(error => {
                console.error('Export error:', error);
                alert('Error exporting data');
            })
            .finally(() => setLoadingExport(false));
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Valida el tipo de archivo
        if (!file.name.endsWith('.csv')) {
            alert('Please upload a CSV file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setLoadingImport(true);
        fetch('/csv/import', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to import data');
            }
            alert('Data imported successfully');
            // Recarga la lista
            return fetch('/items')
                .then(r => r.json())
                .then(setItems);
        })
        .catch(error => {
            console.error('Import error:', error);
            alert('Error importing data');
        })
        .finally(() => setLoadingImport(false));
    };

    if (items === null) return 'Loading...';

    return (
        <React.Fragment>
            <AddItemForm onNewItem={onNewItem} />
            <div className="text-center mb-3">
                <button
                    onClick={handleExport}
                    className="btn btn-primary mr-2"
                    disabled={loadingExport}
                >
                    {loadingExport ? 'Exporting...' : 'Export List to CSV'}
                </button>
                <label className="btn btn-secondary">
                    {loadingImport ? 'Importing...' : 'Import CSV'}
                    <input
                        type="file"
                        onChange={handleImport}
                        style={{ display: 'none' }}
                        accept=".csv"
                    />
                </label>
            </div>
            {items.length === 0 && (
                <p className="text-center">¡Aún no hay artículos! ¡Agrega uno arriba!</p>
            )}
            {items.map(item => (
                <ItemDisplay
                    item={item}
                    key={item.id}
                    onItemUpdate={onNewItem}
                />
            ))}
        </React.Fragment>
    );
}

function AddItemForm({ onNewItem }) {
    const { Form, InputGroup, Button } = ReactBootstrap;

    const [newItem, setNewItem] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    const submitNewItem = e => {
        e.preventDefault();
        setSubmitting(true);
        fetch('/items', {
            method: 'POST',
            body: JSON.stringify({ name: newItem }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(r => r.json())
            .then(item => {
                onNewItem(item);
                setSubmitting(false);
                setNewItem('');
            });
    };

    return (
        <Form onSubmit={submitNewItem}>
            <InputGroup className="mb-3">
                <Form.Control
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    type="text"
                    placeholder="Nuevos Items"
                    aria-describedby="basic-addon1"
                />
                <InputGroup.Append>
                    <Button
                        type="submit"
                        variant="success"
                        disabled={!newItem.length || submitting}
                    >
                        {submitting ? 'Adding...' : 'Add Item'}
                    </Button>
                </InputGroup.Append>
            </InputGroup>
        </Form>
    );
}

function ItemDisplay({ item, onItemUpdate, onItemRemoval }) {
    const { Container, Row, Col, Button } = ReactBootstrap;

    const toggleCompletion = () => {
        fetch(`/items/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: item.name,
                completed: !item.completed,
            }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(r => r.json())
            .then(onItemUpdate);
    };

    const removeItem = () => {
        fetch(`/items/${item.id}`, { method: 'DELETE' }).then(() =>
            onItemRemoval(item),
        );
    };

    return (
        <Container fluid className={`item ${item.completed && 'completed'}`}>
            <Row>
                <Col xs={1} className="text-center">
                    <Button
                        className="toggles"
                        size="sm"
                        variant="link"
                        onClick={toggleCompletion}
                        aria-label={
                            item.completed
                                ? 'Mark item as incomplete'
                                : 'Mark item as complete'
                        }
                    >
                        <i
                            className={`far ${
                                item.completed ? 'fa-check-square' : 'fa-square'
                            }`}
                        />
                    </Button>
                </Col>
                <Col xs={10} className="name">
                    {item.name}
                </Col>
                <Col xs={1} className="text-center remove">
                    <Button
                        size="sm"
                        variant="link"
                        onClick={removeItem}
                        aria-label="Remove Item"
                    >
                        <i className="fa fa-trash text-danger" />
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
