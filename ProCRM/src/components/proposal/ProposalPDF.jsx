import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    padding: 40,
    backgroundColor: '#ffffff'
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 'auto',
    height: 60,
    maxHeight: 60,
    objectFit: 'contain',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  clientInfo: {
    marginTop: 5,
    fontSize: 12
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#334155',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 5,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  serviceName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  serviceDescription: {
    fontSize: 10,
    color: '#475569',
    marginTop: 4,
    width: '70%',
  },
  servicePrice: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right'
  },
  summary: {
    marginTop: 30,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#334155',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 12,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  signatureSection: {
    marginTop: 40,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 5
  },
  signatureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  signatureImage: {
    width: 200,
    height: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  signatureInfo: {
    marginTop: 10
  },
  footerText: {
    marginTop: 30,
    fontSize: 9,
    color: '#475569',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingTop: 10,
  },
  descriptionText: {
    fontSize: 11,
    lineHeight: 1.5,
  }
});

const ProposalPDF = ({ proposal, logoUrl }) => {
  const approvedServices = proposal.services.filter(s => proposal.approved_services.includes(s.id));
  const subtotal = approvedServices.reduce((sum, service) => sum + (Number(service.price) || 0), 0);
  const discountPercentage = Number(proposal.discount) || 0;
  const discountAmount = subtotal * (discountPercentage / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const iva = subtotalAfterDiscount * 0.15;
  const total = subtotalAfterDiscount + iva;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {logoUrl && <Image style={styles.logo} src={logoUrl} />}
          <Text style={styles.title}>Propuesta de Servicios</Text>
          <Text style={styles.clientInfo}>Para: {proposal.client_name} ({proposal.client_company})</Text>
        </View>

        {proposal.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción del Proyecto</Text>
            <Text style={styles.descriptionText}>{proposal.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servicios Aprobados</Text>
          {approvedServices.map(service => (
            <View key={service.id} style={styles.serviceItem}>
              <View style={{flex: 3}}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.servicePrice}>${(Number(service.price) || 0).toLocaleString()}</Text>
                <Text style={{fontSize: 10, color: '#475569', textAlign: 'right'}}>{service.frequency}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Subtotal</Text>
              <Text style={styles.summaryText}>${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          </View>
          <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Descuento ({discountPercentage}%)</Text>
              <Text style={styles.summaryText}>-${discountAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          </View>
          <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>IVA (15%)</Text>
              <Text style={styles.summaryText}>${iva.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          </View>
          <View style={[styles.summaryRow, {marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0'}]}>
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.totalAmount}>${total.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
          </View>
        </View>
        
        {proposal.status === 'approved' && proposal.signature && (
          <View style={styles.signatureSection}>
            <Text style={styles.signatureTitle}>Aprobado y Firmado por:</Text>
            <Image style={styles.signatureImage} src={proposal.signature} />
            <View style={styles.signatureInfo}>
              <Text>{proposal.client_signature_name}</Text>
              <Text>{proposal.client_signature_email}</Text>
              <Text>Fecha de Aprobación: {new Date(proposal.approved_at).toLocaleDateString()}</Text>
            </View>
          </View>
        )}

        <Text style={styles.footerText}>
          Al aprobar esta propuesta, usted acepta los términos y condiciones de nuestros servicios. Para poder comenzar los servicios, requerimos la cancelación del 50% del total.
        </Text>
      </Page>
    </Document>
  );
};

export default ProposalPDF;