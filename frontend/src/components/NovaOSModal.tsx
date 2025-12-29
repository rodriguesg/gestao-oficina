import { useEffect, useState } from 'react'
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  Button, FormControl, FormLabel, Select, Input, VStack, useToast, Text
} from '@chakra-ui/react'
import api from '../services/api'
import type { Cliente, Veiculo } from '../types'

interface NovaOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Mecanico {
    id: number;
    nome: string;
}

export default function NovaOSModal({ isOpen, onClose, onSuccess }: NovaOSModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [mecanicos, setMecanicos] = useState<Mecanico[]>([])

  // Seleções
  const [clienteId, setClienteId] = useState('')
  const [veiculoId, setVeiculoId] = useState('')
  const [mecanicoId, setMecanicoId] = useState('')
  const [defeito, setDefeito] = useState('')
  const [km, setKm] = useState('')

  const toast = useToast()

  // Carrega Clientes e Mecânicos ao abrir
  useEffect(() => {
    if (isOpen) {
        api.get('/clientes/').then(r => setClientes(r.data))
        api.get('/mecanicos/').then(r => setMecanicos(r.data)) // Certifique-se que essa rota existe
        setVeiculoId('') // Reseta veiculo ao reabrir
    }
  }, [isOpen])

  // Carrega Veículos quando Cliente muda
  useEffect(() => {
      if (clienteId) {
          api.get(`/clientes/${clienteId}/veiculos`).then(r => setVeiculos(r.data))
      } else {
          setVeiculos([])
      }
  }, [clienteId])

  const handleSalvar = async () => {
      if (!veiculoId || !mecanicoId || !defeito) {
          toast({ title: 'Preencha todos os campos obrigatórios', status: 'warning' })
          return
      }

      try {
          await api.post('/os/', {
              veiculo_id: parseInt(veiculoId),
              mecanico_id: parseInt(mecanicoId),
              defeito_reclamado: defeito,
              km_atual: parseInt(km) || 0
          })
          toast({ title: 'OS Aberta com Sucesso!', status: 'success' })
          onSuccess()
          onClose()
          // Limpa campos
          setClienteId(''); setVeiculoId(''); setMecanicoId(''); setDefeito(''); setKm('')
      } catch (error) {
          toast({ title: 'Erro ao abrir OS', status: 'error' })
      }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Nova Ordem de Serviço</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
            <VStack spacing={4}>
                <FormControl isRequired>
                    <FormLabel>1. Cliente</FormLabel>
                    <Select placeholder="Selecione o cliente..." value={clienteId} onChange={e => setClienteId(e.target.value)}>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </Select>
                </FormControl>

                <FormControl isRequired isDisabled={!clienteId}>
                    <FormLabel>2. Veículo</FormLabel>
                    <Select placeholder={clienteId ? "Selecione o veículo..." : "Escolha um cliente primeiro"} value={veiculoId} onChange={e => setVeiculoId(e.target.value)}>
                        {veiculos.map(v => <option key={v.id} value={v.id}>{v.modelo} - {v.placa}</option>)}
                    </Select>
                    {clienteId && veiculos.length === 0 && <Text fontSize="xs" color="red.400">Este cliente não tem veículos.</Text>}
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>3. Mecânico Responsável</FormLabel>
                    <Select placeholder="Selecione..." value={mecanicoId} onChange={e => setMecanicoId(e.target.value)}>
                        {mecanicos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                    </Select>
                </FormControl>

                <FormControl isRequired>
                    <FormLabel>Defeito Reclamado</FormLabel>
                    <Input placeholder="Ex: Barulho no freio" value={defeito} onChange={e => setDefeito(e.target.value)} />
                </FormControl>
                
                <FormControl>
                    <FormLabel>KM Atual</FormLabel>
                    <Input type="number" value={km} onChange={e => setKm(e.target.value)} />
                </FormControl>
            </VStack>
        </ModalBody>
        <ModalFooter>
            <Button onClick={onClose} mr={3}>Cancelar</Button>
            <Button colorScheme="blue" onClick={handleSalvar}>Abrir OS</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}